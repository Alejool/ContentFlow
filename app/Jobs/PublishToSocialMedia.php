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

use App\Models\User;

class PublishToSocialMedia implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public $timeout = 300;
  public $tries = 3;
  public $backoff = [30, 60, 120];
  public $maxExceptions = 3;
  public $failOnTimeout = true;

  public function __construct(
    private int $publicationId,
    private array $socialAccountIds
  ) {}

  public function handle(PlatformPublishService $publishService): void
  {
    $publication = Publication::find($this->publicationId);
    
    if (!$publication) {
      Log::error('Publication not found', ['id' => $this->publicationId]);
      $this->delete();
      return;
    }

    $socialAccounts = \App\Models\Social\SocialAccount::whereIn('id', $this->socialAccountIds)
      ->get();

    if ($socialAccounts->isEmpty()) {
      Log::error('No social accounts found', ['ids' => $this->socialAccountIds]);
      $publication->update(['status' => 'failed']);
      $this->delete();
      return;
    }

    $publication->update(['status' => 'publishing']);

    event(new PublicationStatusUpdated(
      userId: $publication->user_id,
      publicationId: $publication->id,
      status: 'publishing'
    ));

    Log::info('Starting background publishing', [
      'publication_id' => $publication->id,
      'attempt' => $this->attempts()
    ]);

    try {
      $result = $publishService->publishToAllPlatforms(
        $publication,
        $socialAccounts
      );

      $platformResults = $result['platform_results'] ?? [];
      $publisher = User::find($publication->published_by);

      if (empty($platformResults)) {
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
            
            $this->sendFailureNotification(
              $publication,
              $platform,
              $pResult['errors'][0]['message'] ?? 'Unknown platform error'
            );
          }
        }
      }

      $anySuccess = collect($platformResults)
        ->contains(fn($r) => !empty($r['success']));

      if ($anySuccess) {
        $publication->logActivity('published');
        $publication->update([
          'status' => 'published',
          'publish_date' => now(),
        ]);
      } else {
        $publication->logActivity('failed', [
          'reason' => empty($platformResults) ? ($result['message'] ?? 'Initialization failed') : 'All platforms failed',
        ], $publisher);

        $publication->update(['status' => 'failed']);
        
        $this->sendGeneralFailureNotification(
          $publication,
          empty($platformResults) ? ($result['message'] ?? 'Initialization failed') : 'All platforms failed'
        );
      }
    } catch (\Throwable $e) {
      Log::error('Publishing job crashed', [
        'publication_id' => $publication->id,
        'error' => $e->getMessage(),
        'attempt' => $this->attempts(),
        'trace' => $e->getTraceAsString(),
      ]);

      $publisher = User::find($publication->published_by);
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

      $publication->update(['status' => 'failed']);
      
      $this->sendGeneralFailureNotification($publication, 'Job crashed: ' . $e->getMessage());
      
      throw $e;
    }

    event(new PublicationStatusUpdated(
      userId: $publication->user_id,
      publicationId: $publication->id,
      status: $publication->status
    ));

    if ($publication->published_by && $publication->published_by !== $publication->user_id) {
      event(new PublicationStatusUpdated(
        userId: $publication->published_by,
        publicationId: $publication->id,
        status: $publication->status
      ));
    }
  }
  
  private function sendFailureNotification(Publication $publication, string $platform, string $error): void
  {
    try {
      $notification = new \App\Notifications\PublicationFailedNotification(
        $publication,
        $platform,
        $error
      );
      
      $publication->user->notify($notification);
      
      if ($publication->workspace) {
        $publication->workspace->notify($notification);
      }
    } catch (\Exception $e) {
      Log::error('Failed to send failure notification', [
        'publication_id' => $publication->id,
        'platform' => $platform,
        'error' => $e->getMessage()
      ]);
    }
  }
  
  private function sendGeneralFailureNotification(Publication $publication, string $reason): void
  {
    try {
      $notification = new \App\Notifications\PublicationPostFailedNotification(
        $publication,
        $reason
      );
      
      $publication->user->notify($notification);
      
      if ($publication->workspace) {
        $publication->workspace->notify($notification);
      }
    } catch (\Exception $e) {
      Log::error('Failed to send general failure notification', [
        'publication_id' => $publication->id,
        'error' => $e->getMessage()
      ]);
    }
  }
  
  public function failed(\Throwable $exception): void
  {
    Log::error('PublishToSocialMedia job failed permanently', [
      'publication_id' => $this->publicationId,
      'error' => $exception->getMessage(),
      'attempts' => $this->attempts()
    ]);

    $publication = Publication::find($this->publicationId);
    
    if (!$publication) {
      Log::error('Publication not found in failed handler', ['id' => $this->publicationId]);
      return;
    }

    $publication->update(['status' => 'failed']);
    
    $publisher = User::find($publication->published_by);
    $publication->logActivity('failed', [
      'reason' => 'Max attempts exceeded',
      'error' => $exception->getMessage(),
      'attempts' => $this->attempts()
    ], $publisher);

    $this->sendGeneralFailureNotification(
      $publication,
      'Max attempts exceeded: ' . $exception->getMessage()
    );

    event(new PublicationStatusUpdated(
      userId: $publication->user_id,
      publicationId: $publication->id,
      status: 'failed'
    ));
  }
}
