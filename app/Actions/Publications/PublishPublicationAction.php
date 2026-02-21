<?php

namespace App\Actions\Publications;

use App\Jobs\PublishToSocialMedia;
use App\Models\Publications\Publication;
use App\Models\Social\ScheduledPost;
use App\Models\Social\SocialAccount;
use App\Services\Media\MediaProcessingService;
use App\Events\PublicationStatusUpdated;
use Illuminate\Support\Facades\Log;
use App\Models\Social\SocialPostLog;
use App\Services\Publish\PlatformPublishService;
use App\Helpers\LogHelper;

class PublishPublicationAction
{
  public function __construct(
    protected MediaProcessingService $mediaService,
    protected PlatformPublishService $platformPublishService
  ) {}

  public function execute(Publication $publication, array $platformIds, array $options = []): void
  {
    Log::info('Executing PublishPublicationAction', [
      'publication_id' => $publication->id,
      'platforms' => $platformIds,
      'has_thumbnails' => !empty($options['thumbnails']),
      'has_platform_settings' => !empty($options['platform_settings'])
    ]);

    if (!$publication->isApproved()) {
      // Check if user is authorized to approve (Owner/Admin)
      $user = auth()->user();
      if ($user && $user->hasPermission('approve', $publication->workspace_id)) {
        // Auto-approve
        $publication->forceFill([
          'status' => 'approved',
          'approved_by' => $user->id,
          'approved_at' => now(),
          'approved_retries_remaining' => 3, // Set retries on auto-approve too
        ])->save();
      } else {
        throw new \Exception("Publication must be approved before publishing.");
      }
    } else {
      // If it's already approved but failed, and we are retrying, decrement retries
      if ($publication->status === 'failed' && $publication->approved_retries_remaining > 0) {
        $publication->decrement('approved_retries_remaining');
      }
    }

    if (is_string($platformIds)) {
      $platformIds = explode(',', $platformIds);
    }
    $platformIds = array_filter(array_values($platformIds));

    $socialAccounts = SocialAccount::where('workspace_id', $publication->workspace_id)
      ->whereIn('id', $platformIds)
      ->get();

    if ($socialAccounts->isEmpty()) {
      throw new \Exception("No valid social accounts found for publishing.");
    }

    // Handle Thumbnails for Publish (if any)
    if (!empty($options['thumbnails'] ?? [])) {
      LogHelper::publicationInfo('Processing thumbnails in PublishPublicationAction', [
        'publication_id' => $publication->id,
        'count' => count($options['thumbnails'])
      ]);
      foreach ($options['thumbnails'] as $mediaId => $thumbnailFile) {
        $mediaFile = $publication->mediaFiles->find($mediaId);
        if ($mediaFile) {
          Log::info('Creating thumbnail for media', ['media_id' => $mediaId]);
          $this->mediaService->createThumbnail($mediaFile, $thumbnailFile);
        } else {
          Log::warning('Media file not found for thumbnail', ['media_id' => $mediaId]);
        }
      }
    }

    // Update platform settings if provided
    if (!empty($options['platform_settings'])) {
      $publication->update(['platform_settings' => $options['platform_settings']]);
    }

    $publication->logActivity('publishing', ['platforms' => $platformIds]);

    $publication->update([
      'status' => 'publishing',
      'published_by' => auth()->id(),
      'published_at' => now(),
    ]);

    // Notify immediately that publishing has started (Broadcast)
    event(new PublicationStatusUpdated(
      userId: $publication->user_id,
      publicationId: $publication->id,
      status: 'publishing'
    ));

    // Send notification with platform details
    try {
      $accountsData = $socialAccounts->map(fn($acc) => [
        'platform' => $acc->platform,
        'account_name' => $acc->account_name
      ])->toArray();
      
      $notification = new \App\Notifications\PublicationProcessingStartedNotification($publication, $accountsData);
      
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
      Log::error('Failed to send processing notification', [
        'publication_id' => $publication->id,
        'error' => $e->getMessage()
      ]);
    }

    // NOTE: Final result notifications will be sent at the end of the job

    // Mark any pending scheduled posts for these platforms as 'posted'
    ScheduledPost::where('publication_id', $publication->id)
      ->whereIn('social_account_id', $socialAccounts->pluck('id'))
      ->where('status', 'pending')
      ->update(['status' => 'posted']);

    // Initialize logs using the service to ensure matching data (media_file_id)
    // This prevents logs from being deleted/recreated by the job later
    try {
      $this->platformPublishService->initializeLogs($publication, $socialAccounts);
    } catch (\Exception $e) {
      Log::error('Failed to initialize logs in action', ['error' => $e->getMessage()]);
      // Continue anyway, the job will try again
    }

    // Clear the cache so getPublishedPlatforms returns fresh data
    cache()->forget("publication_{$publication->id}_platforms");

    // Obtener información de la cola antes de despachar
    $queueSize = \Illuminate\Support\Facades\Redis::llen('queues:publishing');
    $estimatedWaitMinutes = $this->estimateWaitTime($queueSize);

    LogHelper::jobInfo('Dispatching PublishToSocialMedia job', [
      'publication_id' => $publication->id,
      'platform_count' => $socialAccounts->count(),
      'platforms' => $socialAccounts->pluck('platform')->toArray(),
      'queue_size' => $queueSize,
      'estimated_wait_minutes' => $estimatedWaitMinutes
    ]);

    // Determinar prioridad basada en el tamaño del archivo
    $priority = $this->determineJobPriority($publication);
    
    $job = PublishToSocialMedia::dispatch(
      $publication->id,
      $socialAccounts->pluck('id')->toArray()
    )->onQueue('publishing');
    
    // Si el archivo es pequeño, darle mayor prioridad
    if ($priority === 'high') {
      Log::info('Small file detected, using high priority', [
        'publication_id' => $publication->id
      ]);
    }
    
    // Notificar al usuario sobre la posición en cola si hay espera
    if ($queueSize > 0) {
      try {
        $user = auth()->user();
        if ($user) {
          $user->notify(new \App\Notifications\PublicationQueuedNotification(
            $publication,
            $queueSize + 1,
            $estimatedWaitMinutes
          ));
        }
      } catch (\Exception $e) {
        Log::error('Failed to send queue notification', [
          'publication_id' => $publication->id,
          'error' => $e->getMessage()
        ]);
      }
    }
  }
  
  /**
   * Estimar tiempo de espera basado en el tamaño de la cola
   */
  private function estimateWaitTime(int $queueSize): int
  {
    if ($queueSize === 0) {
      return 0;
    }
    
    // Estimación: cada job toma aproximadamente 8 minutos en promedio
    // Con 5 workers simultáneos, dividimos el tiempo
    $avgJobTimeMinutes = 8;
    $concurrentWorkers = 5;
    
    $estimatedMinutes = ceil(($queueSize * $avgJobTimeMinutes) / $concurrentWorkers);
    
    return (int) $estimatedMinutes;
  }
  
  /**
   * Determinar la prioridad del job basado en el tamaño del archivo
   */
  private function determineJobPriority(Publication $publication): string
  {
    if (!$publication->media_path) {
      return 'normal';
    }
    
    $filePath = storage_path('app/' . $publication->media_path);
    if (!file_exists($filePath)) {
      return 'normal';
    }
    
    $fileSizeMB = filesize($filePath) / 1024 / 1024;
    
    // Archivos menores a 50MB tienen prioridad alta
    if ($fileSizeMB < 50) {
      return 'high';
    }
    
    // Archivos entre 50-200MB tienen prioridad normal
    if ($fileSizeMB < 200) {
      return 'normal';
    }
    
    // Archivos mayores a 200MB tienen prioridad baja
    return 'low';
  }
}
