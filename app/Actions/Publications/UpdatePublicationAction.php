<?php

namespace App\Actions\Publications;

use App\Models\Publications\Publication;
use App\Services\Media\MediaProcessingService;
use App\Services\Scheduling\SchedulingService;
use Illuminate\Support\Facades\DB;

class UpdatePublicationAction
{
  public function __construct(
    protected MediaProcessingService $mediaService,
    protected SchedulingService $schedulingService
  ) {}

  public function execute(Publication $publication, array $data, array $newFiles = []): Publication
  {
    return DB::transaction(function () use ($publication, $data, $newFiles) {
      $updateData = [
        'title' => $data['title'],
        'description' => $data['description'],
        'hashtags' => $data['hashtags'] ?? $publication->hashtags,
        'goal' => $data['goal'] ?? $publication->goal,
        'start_date' => $data['start_date'] ?? $publication->start_date,
        'end_date' => $data['end_date'] ?? $publication->end_date,
        'status' => $data['status'] ?? $publication->status,
        'scheduled_at' => $data['scheduled_at'] ?? $publication->scheduled_at,
      ];

      if (isset($data['platform_settings'])) {
        $updateData['platform_settings'] = is_string($data['platform_settings'])
          ? json_decode($data['platform_settings'], true)
          : $data['platform_settings'];
      }

      if (($data['status'] ?? null) === 'published' && !$publication->publish_date) {
        $updateData['publish_date'] = now();
      }

      $publication->update($updateData);

      // Handle Campaign
      if (isset($data['campaign_id'])) {
        if (empty($data['campaign_id'])) {
          $publication->campaigns()->detach();
        } else {
          $publication->campaigns()->sync([$data['campaign_id']]);
        }
      }

      // Handle Media Deletions
      $mediaKeepIds = $data['media_keep_ids'] ?? [];
      $publication->mediaFiles()->whereNotIn('media_files.id', $mediaKeepIds)->get()->each(function ($mediaFile) {
        $this->mediaService->deleteMediaFile($mediaFile);
      });

      // Handle Thumbnail Deletions
      if (!empty($data['removed_thumbnail_ids'])) {
        $this->mediaService->deleteThumbnails($data['removed_thumbnail_ids']);
      }

      // Handle Existing Media Thumbnails
      if (!empty($data['thumbnails'])) {
        $this->mediaService->handleExistingThumbnails($publication, $data['thumbnails']);
      }

      // Handle YouTube Specific Thumbnail
      if (!empty($data['youtube_thumbnail']) && !empty($data['youtube_thumbnail_video_id'])) {
        $this->mediaService->handleYoutubeThumbnail(
          $publication,
          $data['youtube_thumbnail'],
          (int)$data['youtube_thumbnail_video_id']
        );
      }

      // Handle New Media
      if (!empty($newFiles)) {
        $this->mediaService->processUploads($publication, $newFiles, [
          'youtube_types' => $data['youtube_types_new'] ?? [],
          'durations' => $data['durations_new'] ?? [],
          'thumbnails' => $data['thumbnails'] ?? [],
        ]);
      }

      // Handle Schedules
      if (array_key_exists('social_accounts', $data)) {
        $this->schedulingService->syncSchedules(
          $publication,
          $data['social_accounts'] ?? [],
          $data['social_account_schedules'] ?? $data['account_schedules'] ?? []
        );
      }

      return $publication->load(['mediaFiles.derivatives', 'scheduled_posts.socialAccount', 'socialPostLogs.socialAccount', 'campaigns']);
    });
  }
}
