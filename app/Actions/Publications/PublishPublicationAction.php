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
      Log::info('Processing thumbnails in PublishPublicationAction', [
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

    $publication->update([
      'status' => 'publishing',
      'published_by' => auth()->id(),
      'published_at' => now(),
    ]);

    // Notify immediately that publishing has started
    event(new PublicationStatusUpdated(
      userId: $publication->user_id,
      publicationId: $publication->id,
      status: 'publishing'
    ));

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

    Log::info('Dispatching PublishToSocialMedia job', [
      'publication_id' => $publication->id,
      'platform_count' => $socialAccounts->count()
    ]);

    PublishToSocialMedia::dispatch($publication, $socialAccounts)->onQueue('publishing');
  }
}
