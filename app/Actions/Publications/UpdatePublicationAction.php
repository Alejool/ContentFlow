<?php

namespace App\Actions\Publications;

use App\Models\Publications\Publication;
use App\Services\Media\MediaProcessingService;
use App\Services\Scheduling\SchedulingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdatePublicationAction
{
  public function __construct(
    protected MediaProcessingService $mediaService,
    protected SchedulingService $schedulingService
  ) {}

  public function execute(Publication $publication, array $data, array $newFiles = []): Publication
  {
    $start = microtime(true);
    \Log::info("⏱️ Starting UpdatePublicationAction for pub {$publication->id}");

    return DB::transaction(function () use ($publication, $data, $newFiles, $start) {
      // Determine status based on scheduled_at and current state
      $currentStatus = $publication->status;
      $newStatus = $data['status'] ?? $currentStatus;

      // Handle status transitions
      if (!empty($data['scheduled_at'])) {
        // If scheduling and current status allows it
        if (in_array($currentStatus, ['draft', 'scheduled', 'failed', 'rejected', 'approved'])) {
          $newStatus = 'scheduled';
        }
      } elseif (empty($data['scheduled_at']) && $currentStatus === 'scheduled') {
        // If removing schedule from scheduled publication
        $newStatus = 'draft';
      }

      // If currently processing, we MUST preserve that status unless this action is specifically finishing the job.
      // And we must block NEW media uploads if it is processing.
      if ($currentStatus === 'processing') {
        $newStatus = 'processing'; // Force keep processing

        if (!empty($newFiles)) {
          throw new \Exception('Cannot upload new media while publication is processing. Please wait.');
        }
      }

      // Check for video uploads to set processing status (only if not already processing)
      if ($currentStatus !== 'processing') {
        foreach ($newFiles as $file) {
          $isVideo = false;
          if ($file instanceof \Illuminate\Http\UploadedFile) {
            $isVideo = str_starts_with($file->getMimeType(), 'video/');
          } elseif (is_array($file)) {
            $isVideo = str_starts_with($file['mime_type'] ?? '', 'video/');
          }

          if ($isVideo) {
            $newStatus = 'processing';
            break;
          }
        }
      }

      $updateData = [
        'title' => $data['title'],
        'description' => $data['description'],
        'hashtags' => $data['hashtags'] ?? $publication->hashtags,
        'goal' => $data['goal'] ?? $publication->goal,
        'start_date' => $data['start_date'] ?? $publication->start_date,
        'end_date' => $data['end_date'] ?? $publication->end_date,
        'status' => $newStatus,
        'scheduled_at' => $data['scheduled_at'] ?? $publication->scheduled_at,
      ];

      if (isset($data['platform_settings'])) {
        $updateData['platform_settings'] = is_string($data['platform_settings'])
          ? json_decode($data['platform_settings'], true)
          : $data['platform_settings'];
      }

      if ($newStatus === 'published' && !$publication->publish_date) {
        $updateData['publish_date'] = now();
      }

      $publication->update($updateData);
      \Log::info("⏱️ Pub basic update took: " . (microtime(true) - $start) . "s");

      // Handle Campaign
      if (isset($data['campaign_id'])) {
        if (empty($data['campaign_id'])) {
          $publication->campaigns()->detach();
        } else {
          $publication->campaigns()->sync([$data['campaign_id']]);
        }
      }

      // Handle Media Deletions
      // Handle Media Deletions (Explicitly)
      if (!empty($data['removed_media_ids'])) {
        \Log::info("🗑️ Removing media files from publication {$publication->id}", ['ids' => $data['removed_media_ids']]);
        $publication->mediaFiles()->whereIn('media_files.id', $data['removed_media_ids'])->get()->each(function ($mediaFile) {
          $this->mediaService->deleteMediaFile($mediaFile);
        });
      }

      // Legacy support: If media_keep_ids IS provided but removed_media_ids is NOT, fallback to old logic?
      // No, let's stick to explicit removal to solve the race condition.
      // But we must ensure the frontend ALWAYS sends removed_media_ids if it wants to remove something.
      // The current frontend does send it.

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
        \Log::info("⏱️ ProcessUploads took: " . (microtime(true) - $start) . "s");
      }

      // Handle Schedules - Always process if social_accounts key exists
      if (array_key_exists('social_accounts', $data)) {
        $this->schedulingService->syncSchedules(
          $publication,
          $data['social_accounts'] ?? [],
          $data['social_account_schedules'] ?? $data['account_schedules'] ?? []
        );
      } elseif (!empty($data['scheduled_at']) && $publication->status !== 'scheduled') {
        // If there's a scheduled date but no social accounts processing, update status
        $publication->update(['status' => 'scheduled']);
      } elseif (empty($data['scheduled_at']) && $publication->status === 'scheduled') {
        // If scheduled date is removed, revert to draft
        $publication->update(['status' => 'draft']);
      }

      // REMOVED Redundant load - PublicationUpdated broadcast handles this with specific limits
      // $publication->load(['mediaFiles.derivatives', 'scheduled_posts.socialAccount', 'socialPostLogs.socialAccount', 'campaigns']);

      // Broadcast update to other users in the workspace
      \App\Events\Publications\PublicationUpdated::dispatch($publication);
      \Log::info("⏱️ Event dispatch took: " . (microtime(true) - $start) . "s");

      \Log::info("✅ UpdatePublicationAction completed for pub {$publication->id} in " . (microtime(true) - $start) . "s");
      return $publication;
    });
  }
}
