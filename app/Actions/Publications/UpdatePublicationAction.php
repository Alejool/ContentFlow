<?php

namespace App\Actions\Publications;

use App\Models\Publications\Publication;
use App\Events\Publications\PublicationUpdated;
use App\Services\Media\MediaProcessingService;
use App\Services\Scheduling\SchedulingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class UpdatePublicationAction
{
  public function __construct(
    protected MediaProcessingService $mediaService,
    protected SchedulingService $schedulingService
  ) {}

  public function execute(Publication $publication, array $data, array $newFiles = []): Publication
  {
    return DB::transaction(function () use ($publication, $data, $newFiles) {
      // Check if publication is locked for editing
      if ($publication->isLockedForEditing()) {
        throw new \Exception('This publication is locked for editing. It must be rejected or published before changes can be made.');
      }

      // Determine status based on scheduled_at and current state
      $currentStatus = $publication->status;
      $newStatus = $data['status'] ?? $currentStatus;

      // Check if content has changed (requires re-approval)
      $contentChanged = false;
      if ($currentStatus === 'approved' || $currentStatus === 'scheduled') {
        $contentChanged = 
          ($data['title'] !== $publication->title) ||
          ($data['description'] !== $publication->description) ||
          (($data['hashtags'] ?? $publication->hashtags) !== $publication->hashtags) ||
          !empty($newFiles) ||
          !empty($data['removed_media_ids']);
        
        // If content changed, revert to pending for re-approval
        if ($contentChanged) {
          $newStatus = 'pending';
          
          // Clear approval metadata
          $data['approved_by'] = null;
          $data['approved_at'] = null;
          $data['approved_retries_remaining'] = 2;
          
          Log::info('Publication content changed, reverting to pending for re-approval', [
            'publication_id' => $publication->id,
            'previous_status' => $currentStatus
          ]);
        }
      }

      // Prevent manual status changes to bypass approval workflow
      // Only allow specific status transitions
      if (isset($data['status'])) {
        $allowedTransitions = [
          'draft' => ['draft', 'scheduled'],
          'scheduled' => ['draft', 'scheduled'],
          'failed' => ['draft', 'scheduled'],
          'processing' => ['processing'], // Can't change from processing
          'publishing' => ['publishing'], // Can't change from publishing
        ];

        $allowedStatuses = $allowedTransitions[$currentStatus] ?? [$currentStatus];
        
        if (!in_array($data['status'], $allowedStatuses)) {
          // Ignore invalid status change attempt
          unset($data['status']);
          $newStatus = $currentStatus;
        }
      }

      // Handle status transitions
      if (!empty($data['scheduled_at'])) {
        // If scheduling and current status allows it
        if (in_array($currentStatus, ['draft', 'scheduled', 'failed'])) {
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
          if ($file instanceof UploadedFile) {
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

      // Add approval fields if they were cleared due to content changes
      if (isset($data['approved_by'])) {
        $updateData['approved_by'] = $data['approved_by'];
      }
      if (isset($data['approved_at'])) {
        $updateData['approved_at'] = $data['approved_at'];
      }
      if (isset($data['approved_retries_remaining'])) {
        $updateData['approved_retries_remaining'] = $data['approved_retries_remaining'];
      }

      if (isset($data['platform_settings'])) {
        $updateData['platform_settings'] = is_string($data['platform_settings'])
          ? json_decode($data['platform_settings'], true)
          : $data['platform_settings'];
      }

      if ($newStatus === 'published' && !$publication->publish_date) {
        $updateData['publish_date'] = now();
      }

      $publication->update($updateData);

      if (isset($data['campaign_id'])) {
        if (empty($data['campaign_id'])) {
          $publication->campaigns()->detach();
        } else {
          $publication->campaigns()->sync([$data['campaign_id']]);
        }
      }

      if (!empty($data['removed_media_ids'])) {
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
      }

      // Handle Schedules
      $socialAccounts = [];
      $shouldSyncSchedules = false;
      
      // Check if we should clear all social accounts
      if (array_key_exists('clear_social_accounts', $data) && !empty($data['clear_social_accounts'])) {
        $socialAccounts = [];
        $shouldSyncSchedules = true;
      } 
      // Check if social_accounts key exists (even if empty array)
      elseif (array_key_exists('social_accounts', $data)) {
        // Handle case where social_accounts might be sent as JSON string or array
        $socialAccounts = $data['social_accounts'] ?? [];
        
        // If it's a string, try to decode it
        if (is_string($socialAccounts)) {
          $decoded = json_decode($socialAccounts, true);
          $socialAccounts = is_array($decoded) ? $decoded : [];
        }
        
        // Ensure it's an array
        if (!is_array($socialAccounts)) {
          $socialAccounts = [];
        }
        
        // Filter out empty strings and null values, then convert to integers
        $socialAccounts = array_values(array_filter(
          array_map(function($id) {
            return $id === '' || $id === null ? null : intval($id);
          }, $socialAccounts),
          function($id) {
            return $id !== null && $id > 0;
          }
        ));
        
        $shouldSyncSchedules = true;
      }
      
      // Sync schedules if needed
      if ($shouldSyncSchedules) {
        
        $this->schedulingService->syncSchedules(
          $publication,
          $socialAccounts,
          $data['social_account_schedules'] ?? $data['account_schedules'] ?? []
        );
      }

      // Broadcast update to other users in the workspace
      PublicationUpdated::dispatch($publication);

      return $publication;
    });
  }
}
