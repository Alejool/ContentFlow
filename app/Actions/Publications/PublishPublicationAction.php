<?php

namespace App\Actions\Publications;

use App\Jobs\PublishToSocialMedia;
use App\Models\Publications\Publication;
use App\Models\ScheduledPost;
use App\Models\SocialAccount;
use App\Services\Media\MediaProcessingService;
use Illuminate\Support\Facades\Log;

class PublishPublicationAction
{
  public function __construct(
    protected MediaProcessingService $mediaService
  ) {}

  public function execute(Publication $publication, array $platformIds, array $options = []): void
  {
    if (is_string($platformIds)) {
      $platformIds = explode(',', $platformIds);
    }
    $platformIds = array_filter(array_values($platformIds));

    $socialAccounts = SocialAccount::where('user_id', $publication->user_id)
      ->whereIn('id', $platformIds)
      ->get();

    if ($socialAccounts->isEmpty()) {
      throw new \Exception("No valid social accounts found for publishing.");
    }

    // Handle Thumbnails for Publish (if any)
    if (!empty($options['thumbnails'] ?? [])) {
      foreach ($options['thumbnails'] as $mediaId => $thumbnailFile) {
        $mediaFile = $publication->mediaFiles->find($mediaId);
        if ($mediaFile) {
          $this->mediaService->createThumbnail($mediaFile, $thumbnailFile);
        }
      }
    }

    // Update platform settings if provided
    if (!empty($options['platform_settings'])) {
      $publication->update(['platform_settings' => $options['platform_settings']]);
    }

    $publication->update(['status' => 'publishing']);

    // Mark any pending scheduled posts for these platforms as 'posted'
    ScheduledPost::where('publication_id', $publication->id)
      ->whereIn('social_account_id', $socialAccounts->pluck('id'))
      ->where('status', 'pending')
      ->update(['status' => 'posted']);

    PublishToSocialMedia::dispatch($publication, $socialAccounts)->onQueue('publishing');
  }
}
