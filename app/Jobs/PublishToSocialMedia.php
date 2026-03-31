<?php

namespace App\Jobs;

use App\Models\Publications\Publication;
use App\Services\Publish\PlatformPublishService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Events\PublicationStatusUpdated;
use App\Jobs\Middleware\RateLimitPublishing;
use App\Models\Social\SocialAccount;
use App\Notifications\PublicationPublishedNotification;
use App\Notifications\PublicationPostFailedNotification;
use App\Models\Social\SocialPostLog;
use App\Models\User;
use App\Helpers\LogHelper;

class PublishToSocialMedia implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public $timeout = 2000; // 33 minutos para archivos pesados (menor que el worker timeout de 35min)
  public $tries = 2; // Reducir intentos ya que cada uno toma más tiempo
  public $backoff = [60, 180]; // Backoff más largo entre reintentos
  public $maxExceptions = 2;
  public $failOnTimeout = true;

  /**
   * Get the middleware the job should pass through.
   */
  public function middleware(): array
  {
    return [
      new RateLimitPublishing,
      new \App\Jobs\Middleware\PlanBasedPriority,
    ];
  }

  public function __construct(
    public int $publicationId,
    public array $socialAccountIds
  ) {}

  public function handle(PlatformPublishService $publishService): void
  {
    $startTime = microtime(true);
    
    LogHelper::job('PublishToSocialMedia job started', [
      'publication_id' => $this->publicationId,
      'social_account_ids' => $this->socialAccountIds,
      'attempt' => $this->attempts(),
      'job_id' => $this->job->uuid()
    ]);
    
    $publication = Publication::with(['user.currentWorkspace', 'workspace'])->find($this->publicationId);
    
    if (!$publication) {
      LogHelper::publicationError('Publication not found', 'Publication not found', [
        'publication_id' => $this->publicationId,
        'job_id' => $this->job->uuid()
      ]);
      $this->delete();
      return;
    }

    LogHelper::job('Publication loaded', [
      'publication_id' => $publication->id,
      'status' => $publication->status,
      'content_type' => $publication->content_type
    ]);

    $socialAccounts = SocialAccount::whereIn('id', $this->socialAccountIds)
      ->get();

    if ($socialAccounts->isEmpty()) {
      LogHelper::publicationError('No social accounts found', 'No social accounts found', [
        'publication_id' => $publication->id,
        'social_account_ids' => $this->socialAccountIds,
        'job_id' => $this->job->uuid()
      ]);
      $publication->update(['status' => 'failed']);
      $this->delete();
      return;
    }

    LogHelper::job('Social accounts loaded', [
      'publication_id' => $publication->id,
      'account_count' => $socialAccounts->count(),
      'platforms' => $socialAccounts->pluck('platform')->toArray()
    ]);

    // Validate content type compatibility before publishing
    $publishValidationService = app(\App\Services\Validation\PublishValidationService::class);
    $validation = $publishValidationService->validatePublishRequest($publication, $this->socialAccountIds);
    
    LogHelper::job('Validation completed', [
      'publication_id' => $publication->id,
      'can_publish' => $validation['can_publish'],
      'global_errors' => $validation['global_errors'] ?? [],
      'platform_results' => $validation['platform_results']
    ]);
    
    if (!$validation['can_publish']) {
      $errorMessage = 'Publishing validation failed: ' . implode(', ', $validation['global_errors'] ?? []);
      LogHelper::publicationError('Publishing validation failed', $errorMessage, [
        'publication_id' => $publication->id,
        'validation_errors' => $validation['global_errors'] ?? [],
        'job_id' => $this->job->uuid()
      ]);
      
      $publication->update(['status' => 'failed']);
      $this->delete();
      return;
    }

    // Filter out incompatible platforms
    $compatibleAccounts = $socialAccounts->filter(function ($account) use ($validation) {
      $platformResult = $validation['platform_results'][$account->platform] ?? null;
      return $platformResult && $platformResult['compatible'];
    });

    LogHelper::job('Compatible accounts filtered', [
      'publication_id' => $publication->id,
      'original_count' => $socialAccounts->count(),
      'compatible_count' => $compatibleAccounts->count(),
      'compatible_platforms' => $compatibleAccounts->pluck('platform')->toArray()
    ]);

    if ($compatibleAccounts->isEmpty()) {
      LogHelper::publicationError('No compatible platforms found after validation', 'No compatible platforms found after validation', [
        'publication_id' => $publication->id,
        'platform_results' => $validation['platform_results'],
        'job_id' => $this->job->uuid()
      ]);
      $publication->update(['status' => 'failed']);
      $this->delete();
      return;
    }

    // Update social accounts to only compatible ones
    $socialAccounts = $compatibleAccounts;

    $publication->update(['status' => 'publishing']);
    
    // Reset any stale 'publishing' logs from previous failed attempts to 'pending'
    // This prevents duplicate detection issues on retries
    SocialPostLog::where('publication_id', $publication->id)
      ->whereIn('social_account_id', $this->socialAccountIds)
      ->where('status', 'publishing')
      ->update(['status' => 'pending']);
    
    // Update all pending logs to publishing status
    SocialPostLog::where('publication_id', $publication->id)
      ->whereIn('social_account_id', $this->socialAccountIds)
      ->where('status', 'pending')
      ->update(['status' => 'publishing']);

    event(new PublicationStatusUpdated(
      userId: $publication->user_id,
      publicationId: $publication->id,
      status: 'publishing',
      workspaceId: $publication->workspace_id,
      socialAccountIds: $this->socialAccountIds
    ));

    Log::info('Starting background publishing', [
      'publication_id' => $publication->id,
      'attempt' => $this->attempts(),
      'platforms' => $socialAccounts->pluck('platform')->toArray()
    ]);

    try {
      $result = $publishService->publishToAllPlatforms(
        $publication,
        $socialAccounts
      );
      
      $publishDuration = round(microtime(true) - $startTime, 2);
      LogHelper::job('Publishing completed', [
        'publication_id' => $publication->id,
        'duration_seconds' => $publishDuration,
        'job_id' => $this->job->uuid()
      ]);

      $platformResults = $result['platform_results'] ?? [];
      $publisher = User::find($publication->published_by);

      // Check if all platforms were already published (empty results but no errors)
      $allAlreadyPublished = empty($platformResults) && empty($result['errors']) && !empty($result['logs']);

      if ($allAlreadyPublished) {
        // All platforms were already published, treat as success
        Log::info('All platforms already published, treating as success', [
          'publication_id' => $publication->id,
          'logs_count' => count($result['logs'])
        ]);
      } elseif (empty($platformResults)) {
        foreach ($socialAccounts as $account) {
          $publication->logActivity('failed_on_platform', [
            'platform' => $account->platform,
            'error' => $result['message'] ?? 'Platform initialization failed',
          ], $publisher);
        }
      } else {
        foreach ($platformResults as $platform => $pResult) {
          if ($pResult['success']) {
            $publication->logActivity('published_on_platform', [
              'platform' => $platform,
              'log_id' => $pResult['logs'][0]->id ?? null,
            ], $publisher);
          } else {
            $publication->logActivity('failed_on_platform', [
              'platform' => $platform,
              'error' => $pResult['errors'][0]['message'] ?? 'Unknown platform error',
            ], $publisher);
          }
        }
      }

      $anySuccess = $allAlreadyPublished || collect($platformResults)
        ->contains(fn($r) => !empty($r['success']));
      
      $allSuccess = $allAlreadyPublished || collect($platformResults)
        ->every(fn($r) => !empty($r['success']));

      if ($allSuccess) {
        // All platforms succeeded - mark as published and send notification
        $publication->logActivity('published');
        
        // Usar el servicio de estado para actualizar
        $statusService = app(\App\Services\Publications\PublicationStatusService::class);
        $statusService->updatePublicationStatus($publication, true);
        
        $publication->update([
          'publish_date' => now(),
        ]);
        
        // Delete job from queue to prevent retries
        $this->delete();
        $this->sendSuccessNotification($publication, $platformResults);
      } elseif ($anySuccess) {
        // Partial success - some platforms succeeded, others failed
        // Check if this is the last attempt
        if ($this->attempts() >= $this->tries) {
          // Last attempt - mark as published with warnings
          $publication->logActivity('published_with_errors', [
            'successful_platforms' => collect($platformResults)->filter(fn($r) => $r['success'])->keys()->toArray(),
            'failed_platforms' => collect($platformResults)->filter(fn($r) => !$r['success'])->keys()->toArray(),
          ], $publisher);
          
          // Usar el servicio de estado para actualizar
          $statusService = app(\App\Services\Publications\PublicationStatusService::class);
          $statusService->updatePublicationStatus($publication, true);
          
          $publication->update([
            'publish_date' => now(),
          ]);
          
          // Delete job and send notification with partial success info
          $this->delete();
          $this->sendSuccessNotification($publication, $platformResults);
        } else {
          // Not the last attempt - throw exception to retry only failed platforms
          $failedPlatforms = collect($platformResults)
            ->filter(fn($r) => !$r['success'])
            ->keys()
            ->toArray();
          
          $publication->logActivity('partial_success_retrying', [
            'successful_platforms' => collect($platformResults)->filter(fn($r) => $r['success'])->keys()->toArray(),
            'failed_platforms' => $failedPlatforms,
            'attempt' => $this->attempts(),
          ], $publisher);
          
          // Update status to 'retrying'
          $publication->update(['status' => 'retrying']);
          
          // Broadcast status change
          event(new PublicationStatusUpdated(
            userId: $publication->user_id,
            publicationId: $publication->id,
            status: 'retrying',
            workspaceId: $publication->workspace_id,
            socialAccountIds: $this->socialAccountIds
          ));
          
          throw new \Exception('Partial failure, retrying failed platforms: ' . implode(', ', $failedPlatforms));
        }
      } else {
        // All platforms failed
        $publication->logActivity('failed', [
          'reason' => empty($platformResults) ? ($result['message'] ?? 'Initialization failed') : 'All platforms failed',
          'attempt' => $this->attempts(),
        ], $publisher);

        // If this is the last attempt, mark as failed and send notification
        if ($this->attempts() >= $this->tries) {
          $publication->update(['status' => 'failed']);
          
          // Broadcast status change
          event(new PublicationStatusUpdated(
            userId: $publication->user_id,
            publicationId: $publication->id,
            status: 'failed',
            workspaceId: $publication->workspace_id,
            socialAccountIds: $this->socialAccountIds
          ));
          
          // Send failure notification immediately
          $errorMessage = empty($platformResults) 
            ? ($result['message'] ?? 'Initialization failed') 
            : 'All platforms failed';
          $this->sendGeneralFailureNotification($publication, $errorMessage, $platformResults);
          
          // Delete job to prevent further retries
          $this->delete();
          
          return; // Exit without throwing exception
        }
        
        // If not the last attempt, update status to 'retrying'
        $publication->update(['status' => 'retrying']);
        
        // Broadcast status change
        event(new PublicationStatusUpdated(
          userId: $publication->user_id,
          publicationId: $publication->id,
          status: 'retrying',
          workspaceId: $publication->workspace_id,
          socialAccountIds: $this->socialAccountIds
        ));
        
        // Throw exception to trigger retry mechanism
        throw new \Exception('All platforms failed: ' . (empty($platformResults) ? ($result['message'] ?? 'Initialization failed') : 'All platforms failed'));
      }
    } catch (\Throwable $e) {
      Log::error('Publishing job crashed', [
        'publication_id' => $publication->id,
        'error' => $e->getMessage(),
        'attempt' => $this->attempts(),
        'trace' => $e->getTraceAsString(),
      ]);

      $publisher = User::find($publication->published_by);
      
      // Check if this is a quota error (non-retryable)
      $isQuotaError = isset($e->isQuotaError) && $e->isQuotaError === true;
      $isQuotaErrorByMessage = str_contains($e->getMessage(), 'daily YouTube upload limit') || 
                                str_contains($e->getMessage(), 'quota') ||
                                str_contains($e->getMessage(), 'exceeded the number of videos');
      
      if ($isQuotaError || $isQuotaErrorByMessage) {
        // Quota errors should not be retried - mark as failed immediately
        Log::warning('Quota error detected, marking as failed without retry', [
          'publication_id' => $publication->id,
          'error' => $e->getMessage()
        ]);
        
        foreach ($socialAccounts as $account) {
          $publication->logActivity('failed_on_platform', [
            'platform' => $account->platform,
            'error' => $e->getMessage(),
            'note' => 'Quota exceeded - not retryable',
            'attempt' => $this->attempts()
          ], $publisher);
        }
        
        $publication->logActivity('failed', [
          'reason' => 'Quota exceeded',
          'error' => $e->getMessage(),
          'attempt' => $this->attempts()
        ], $publisher);
        
        $publication->update(['status' => 'failed']);
        
        event(new PublicationStatusUpdated(
          userId: $publication->user_id,
          publicationId: $publication->id,
          status: 'failed',
          workspaceId: $publication->workspace_id,
          socialAccountIds: $this->socialAccountIds
        ));
        
        $this->sendGeneralFailureNotification($publication, $e->getMessage(), []);
        
        // Delete job to prevent retries
        $this->delete();
        return;
      }
      
      // For other errors, log and allow retry
      foreach ($socialAccounts as $account) {
        $publication->logActivity('failed_on_platform', [
          'platform' => $account->platform,
          'error' => $e->getMessage(),
          'note' => 'Job crashed',
          'attempt' => $this->attempts()
        ], $publisher);
      }

      $publication->logActivity('failed', [
        'reason' => 'Job crashed',
        'error' => $e->getMessage(),
        'attempt' => $this->attempts()
      ], $publisher);

      // Don't update publication status here - let it stay as 'publishing' until all retries exhausted
      // The failed() method will update it to 'failed' after all retries
      
      // Don't send notification here - will be sent in failed() method after all retries
      
      throw $e;
    }

    event(new PublicationStatusUpdated(
      userId: $publication->user_id,
      publicationId: $publication->id,
      status: $publication->status,
      workspaceId: $publication->workspace_id,
      socialAccountIds: $this->socialAccountIds
    ));

    if ($publication->published_by && $publication->published_by !== $publication->user_id) {
      event(new PublicationStatusUpdated(
        userId: $publication->published_by,
        publicationId: $publication->id,
        status: $publication->status,
        workspaceId: $publication->workspace_id,
        socialAccountIds: $this->socialAccountIds
      ));
    }
  }
  
  private function sendSuccessNotification(Publication $publication, array $platformResults): void
  {
    try {
      $successPlatforms = [];
      $failedPlatforms = [];
      
      foreach ($platformResults as $platform => $result) {
        // Skip platforms that were already published in a previous attempt
        if (!empty($result['skipped'])) {
          continue;
        }
        
        if ($result['success']) {
          $successPlatforms[] = $platform;
        } else {
          $failedPlatforms[] = [
            'platform' => $platform,
            'error' => $result['errors'][0]['message'] ?? 'Unknown error'
          ];
        }
      }
      
      // Only send notification if there are new platforms to report
      if (empty($successPlatforms) && empty($failedPlatforms)) {
        Log::info('No new platforms to notify about, skipping notification', [
          'publication_id' => $publication->id
        ]);
        return;
      }
      
      $notification = new PublicationPublishedNotification(
        $publication,
        $successPlatforms,
        $failedPlatforms
      );
      
      // Notify ALL workspace members (including the one who published)
      if ($publication->workspace) {
        $workspaceUsers = $publication->workspace->users()->get();
        
        Log::info('Notifying all workspace members', [
          'publication_id' => $publication->id,
          'workspace_id' => $publication->workspace_id,
          'member_count' => $workspaceUsers->count(),
          'new_success_platforms' => $successPlatforms,
          'new_failed_platforms' => count($failedPlatforms)
        ]);
        
        foreach ($workspaceUsers as $user) {
          $user->notify($notification);
        }
        
        // Also notify workspace directly if it has webhooks configured (Discord/Slack)
        if ($publication->workspace->discord_webhook_url || $publication->workspace->slack_webhook_url) {
          $publication->workspace->notify($notification);
        }
      }
    } catch (\Exception $e) {
      Log::error('Failed to send success notification', [
        'publication_id' => $publication->id,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);
    }
  }
  
  private function sendGeneralFailureNotification(Publication $publication, string $reason, array $platformResults = []): void
  {
    try {
      $failedPlatforms = [];
      
      foreach ($platformResults as $platform => $result) {
        $errorMessage = $result['errors'][0]['message'] ?? 'Error desconocido';
        $failedPlatforms[] = [
          'platform' => ucfirst($platform),
          'error' => $this->sanitizeErrorMessage($errorMessage)
        ];
      }
      
      $errorMsg = $this->sanitizeErrorMessage($reason);
      
      $notification = new PublicationPostFailedNotification(
        $publication,
        $errorMsg,
        $failedPlatforms
      );
      
      // Notify ALL workspace members (including the one who published)
      if ($publication->workspace) {
        $workspaceUsers = $publication->workspace->users()->get();
        
        foreach ($workspaceUsers as $user) {
          $user->notify($notification);
        }
        
        // Also notify workspace directly if it has webhooks configured (Discord/Slack)
        if ($publication->workspace->discord_webhook_url || $publication->workspace->slack_webhook_url) {
          $publication->workspace->notify($notification);
        }
      }
    } catch (\Exception $e) {
      Log::error('Failed to send general failure notification', [
        'publication_id' => $publication->id,
        'error' => $e->getMessage()
      ]);
    }
  }
  
  private function sanitizeErrorMessage(string $error): string
  {
    // Check for technical errors that should be hidden from users
    $technicalPatterns = [
      '/App\\\\[^:]+/',
      '/Argument #\d+/',
      '/must be of type/',
      '/given, called in/',
      '/Stack trace:/',
      '/in \/[^\s]+\.php/',
      '/on line \d+/',
      '/__construct\(\)/',
      '/Illuminate\\\\[^\s]+/',
      '/vendor\/[^\s]+/',
    ];
    
    foreach ($technicalPatterns as $pattern) {
      if (preg_match($pattern, $error)) {
        return 'No se pudo completar la publicación. Verifica la configuración de la cuenta o intenta nuevamente.';
      }
    }
    
    // If error is too long or empty, use generic message
    if (empty(trim($error)) || strlen($error) > 150) {
      return 'No se pudo completar la publicación. Verifica la configuración de la cuenta o intenta nuevamente.';
    }
    
    return trim($error);
  }
  
  public function failed(\Throwable $exception): void
  {
    Log::error('PublishToSocialMedia job failed permanently after all retries', [
      'publication_id' => $this->publicationId,
      'error' => $exception->getMessage(),
      'attempts' => $this->attempts()
    ]);

    $publication = Publication::find($this->publicationId);
    
    if (!$publication) {
      Log::error('Publication not found in failed handler', ['id' => $this->publicationId]);
      return;
    }

    // Update publication status
    $publication->update(['status' => 'failed']);
    
    // CRITICAL: Update all pending/publishing logs to failed
    // This prevents the frontend from showing "publishing" forever
    $updatedLogs = SocialPostLog::where('publication_id', $this->publicationId)
      ->whereIn('social_account_id', $this->socialAccountIds)
      ->whereIn('status', ['pending', 'publishing'])
      ->update([
        'status' => 'failed',
        'error_message' => $this->sanitizeErrorMessage($exception->getMessage()),
        'updated_at' => now()
      ]);
    
    Log::info('Updated orphaned logs to failed status', [
      'publication_id' => $this->publicationId,
      'updated_count' => $updatedLogs
    ]);
    
    $publisher = User::find($publication->published_by);
    $publication->logActivity('failed', [
      'reason' => 'Max attempts exceeded',
      'error' => $exception->getMessage(),
      'attempts' => $this->attempts()
    ], $publisher);
    
    // Broadcast final status update
    event(new PublicationStatusUpdated(
      userId: $publication->user_id,
      publicationId: $publication->id,
      status: 'failed',
      workspaceId: $publication->workspace_id,
      socialAccountIds: $this->socialAccountIds
    ));

    // ONLY send notification here after ALL retries exhausted
    $socialAccounts = SocialAccount::whereIn('id', $this->socialAccountIds)->get();
    $platformResults = [];
    foreach ($socialAccounts as $account) {
      $platformResults[$account->platform] = [
        'success' => false,
        'errors' => [['message' => $exception->getMessage()]]
      ];
    }
    
    // Send notification to user and workspace (includes Discord/Slack)
    $this->sendGeneralFailureNotification($publication, $exception->getMessage(), $platformResults);
    
    // Also send individual platform notifications to Discord/Slack for each failed log
    $failedLogs = SocialPostLog::where('publication_id', $publication->id)
      ->whereIn('social_account_id', $this->socialAccountIds)
      ->where('status', 'failed')
      ->get();
    
    foreach ($failedLogs as $log) {
      try {
        if ($publication->workspace) {
          $publication->workspace->notify(
            new \App\Notifications\PublicationResultNotification($log, 'failed', $log->error_message)
          );
        }
      } catch (\Exception $e) {
        Log::error('Failed to send platform notification', [
          'log_id' => $log->id,
          'error' => $e->getMessage()
        ]);
      }
    }

    event(new PublicationStatusUpdated(
      userId: $publication->user_id,
      publicationId: $publication->id,
      status: 'failed',
      workspaceId: $publication->workspace_id,
      socialAccountIds: $this->socialAccountIds
    ));
  }
}
