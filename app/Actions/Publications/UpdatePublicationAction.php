<?php

namespace App\Actions\Publications;

use App\Models\Publications\Publication;
use App\Events\Publications\PublicationUpdated;
use App\Services\Media\MediaProcessingService;
use App\Services\Scheduling\SchedulingService;
use App\Services\Publications\ContentTypeValidationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class UpdatePublicationAction
{
  public function __construct(
    protected MediaProcessingService $mediaService,
    protected SchedulingService $schedulingService,
    protected ContentTypeValidationService $validationService
  ) {}

  public function execute(Publication $publication, array $data, array $newFiles = []): Publication
  {
    // Check if there are files being uploaded
    $hasUploadingFiles = $this->hasUploadingFiles($newFiles);
    
    // Conditional validation: only validate if content_type, platforms, or media changed
    // BUT skip validation if files are currently being uploaded
    $contentType = $data['content_type'] ?? $publication->content_type;
    $contentTypeChanged = $contentType !== $publication->content_type;
    $platformsChanged = array_key_exists('social_accounts', $data);
    $mediaChanged = !empty($newFiles) || !empty($data['removed_media_ids']);
    
    // Only validate if content_type is not null and something relevant changed
    // AND no files are currently being uploaded
    if (!empty($contentType) && ($contentTypeChanged || $platformsChanged || $mediaChanged) && !$hasUploadingFiles) {
      // Determine which social accounts to validate against
      $socialAccountIds = [];
      if ($platformsChanged && isset($data['social_accounts'])) {
        // Use new social accounts if they're being changed
        $socialAccounts = $data['social_accounts'];
        if (is_string($socialAccounts)) {
          $decoded = json_decode($socialAccounts, true);
          $socialAccounts = is_array($decoded) ? $decoded : [];
        }
        if (is_array($socialAccounts)) {
          $socialAccountIds = array_values(array_filter(
            array_map(fn($id) => $id === '' || $id === null ? null : intval($id), $socialAccounts),
            fn($id) => $id !== null && $id > 0
          ));
        }
      } else {
        // Use existing social accounts
        $socialAccountIds = $publication->scheduledPosts()
          ->where('status', 'pending')
          ->pluck('social_account_id')
          ->unique()
          ->toArray();
      }
      
      // Determine which media files to validate
      $mediaFiles = $newFiles;
      if (!$mediaChanged || empty($data['removed_media_ids'])) {
        // Include existing media files if not being removed
        $existingMedia = $publication->mediaFiles()
          ->when(!empty($data['removed_media_ids']), function ($query) use ($data) {
            return $query->whereNotIn('media_files.id', $data['removed_media_ids']);
          })
          ->get();
        
        // Convert existing media to a format compatible with validation
        // For existing media, we create mock UploadedFile objects with the mime type
        foreach ($existingMedia as $media) {
          $mockFile = new class($media->mime_type, $media->duration) {
            private $mimeType;
            private $duration;
            public function __construct($mimeType, $duration = null) {
              $this->mimeType = $mimeType;
              $this->duration = $duration;
            }
            public function getMimeType() {
              return $this->mimeType;
            }
            public function getDuration() {
              return $this->duration;
            }
          };
          $mediaFiles[] = $mockFile;
        }
      }
      
      // Validate content type
      $validation = $this->validationService->validateContentType(
        $contentType,
        $socialAccountIds,
        $mediaFiles
      );
      
      if (!$validation->isValid) {
        throw ValidationException::withMessages([
          'content_type' => $validation->errors
        ]);
      }
      
      // Handle auto-conversion suggestions
      if (!empty($validation->suggestions['suggested_content_type'])) {
        $suggestedType = $validation->suggestions['suggested_content_type'];
        $reason = $validation->suggestions['reason'] ?? '';
        
        // Auto-apply the suggestion if it's a video duration-based change
        if ($suggestedType !== $contentType && $this->shouldAutoApplyContentTypeChange($contentType, $suggestedType)) {
          $data['content_type'] = $suggestedType;
          
          // Log the auto-conversion for debugging
          \Log::info("Auto-converted content type", [
            'publication_id' => $publication->id,
            'from' => $contentType,
            'to' => $suggestedType,
            'reason' => $reason
          ]);
        }
      }
    }
    
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
      // Allow text updates but block NEW media uploads if it is processing.
      if ($currentStatus === 'processing') {
        $newStatus = 'processing'; // Force keep processing

        // Only block NEW media uploads, allow text updates
        if (!empty($newFiles)) {
          // Check if these are actually new files or just metadata updates
          $hasActualNewFiles = false;
          foreach ($newFiles as $file) {
            // If it's an UploadedFile object, it's a new upload
            if ($file instanceof UploadedFile) {
              $hasActualNewFiles = true;
              break;
            }
            // If it's metadata without a media_file_id, it's a new upload
            if (is_array($file) && !isset($file['media_file_id'])) {
              $hasActualNewFiles = true;
              break;
            }
          }
          
          if ($hasActualNewFiles) {
            throw new \Exception('Cannot upload new media while publication is processing. Please wait.');
          }
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

      $isRecurring = isset($data['is_recurring']) ? filter_var($data['is_recurring'], FILTER_VALIDATE_BOOLEAN) : $publication->is_recurring;

      // IMPORTANT: Capture original values BEFORE updating the publication
      // This is needed to detect changes in recurrence settings later
      $oldIsRecurring = $publication->is_recurring;
      $oldScheduledAt = $publication->scheduled_at;
      $oldSettings = $publication->recurrenceSettings;
      $oldRecurrenceType = $oldSettings?->recurrence_type ?? $publication->recurrence_type;
      $oldRecurrenceInterval = $oldSettings?->recurrence_interval ?? $publication->recurrence_interval;
      $oldRecurrenceDays = $oldSettings?->recurrence_days ?? $publication->recurrence_days;
      $oldRecurrenceEndDate = $oldSettings?->recurrence_end_date ?? $publication->recurrence_end_date;

      $updateData = [
        'title' => $data['title'],
        'description' => $data['description'],
        'content_type' => $data['content_type'] ?? $publication->content_type,
        'hashtags' => $data['hashtags'] ?? $publication->hashtags,
        'goal' => $data['goal'] ?? $publication->goal,
        'start_date' => $data['start_date'] ?? $publication->start_date,
        'end_date' => $data['end_date'] ?? $publication->end_date,
        'status' => $newStatus,
        'scheduled_at' => $data['scheduled_at'] ?? $publication->scheduled_at,
        'is_recurring' => $isRecurring,
        // Poll fields
        'poll_options' => $data['poll_options'] ?? $publication->poll_options,
        'poll_duration_hours' => $data['poll_duration_hours'] ?? $publication->poll_duration_hours,
      ];
      
      // Handle recurrence settings in separate table
      if ($isRecurring) {
        \Log::info('UpdatePublicationAction: Processing recurrence settings', [
          'publication_id' => $publication->id,
          'recurrence_end_date_from_data' => $data['recurrence_end_date'] ?? 'NOT SET',
          'recurrence_end_date_from_settings' => $publication->recurrenceSettings?->recurrence_end_date ?? 'NOT SET',
          'all_recurrence_data' => [
            'type' => $data['recurrence_type'] ?? 'NOT SET',
            'interval' => $data['recurrence_interval'] ?? 'NOT SET',
            'days' => $data['recurrence_days'] ?? 'NOT SET',
            'end_date' => $data['recurrence_end_date'] ?? 'NOT SET',
            'accounts' => $data['recurrence_accounts'] ?? 'NOT SET',
          ]
        ]);
        
        $recurrenceData = [
          'recurrence_type' => $data['recurrence_type'] ?? $publication->recurrenceSettings?->recurrence_type ?? 'daily',
          'recurrence_interval' => (int)($data['recurrence_interval'] ?? $publication->recurrenceSettings?->recurrence_interval ?? 1),
          'recurrence_days' => array_key_exists('recurrence_days', $data) ? $data['recurrence_days'] : ($publication->recurrenceSettings?->recurrence_days ?? []),
          'recurrence_end_date' => $data['recurrence_end_date'] ?? $publication->recurrenceSettings?->recurrence_end_date ?? null,
          'recurrence_accounts' => $data['recurrence_accounts'] ?? $publication->recurrenceSettings?->recurrence_accounts ?? null,
        ];
        
        \Log::info('UpdatePublicationAction: Final recurrence data to save', [
          'publication_id' => $publication->id,
          'recurrence_data' => $recurrenceData,
        ]);
        
        // Update or create recurrence settings
        $publication->recurrenceSettings()->updateOrCreate(
          ['publication_id' => $publication->id],
          $recurrenceData
        );
        
        // CRITICAL: Immediately unload the relationship so it gets reloaded fresh next time
        $publication->unsetRelation('recurrenceSettings');
        
        \Log::info('UpdatePublicationAction: Recurrence settings saved and relation unset', [
          'publication_id' => $publication->id,
        ]);
      } else {
        // Delete recurrence settings if recurrence is disabled
        $publication->recurrenceSettings()->delete();
        
        // CRITICAL: Unload the relationship after deletion
        $publication->unsetRelation('recurrenceSettings');
        
        // IMPORTANT: Also delete all recurring instance posts (keep only originals)
        $deletedRecurringPosts = \App\Models\Social\ScheduledPost::where('publication_id', $publication->id)
          ->where('status', 'pending')
          ->where('is_recurring_instance', true)
          ->delete();
        
        \Log::info('Recurrence disabled: deleted recurring instance posts', [
          'publication_id' => $publication->id,
          'deleted_count' => $deletedRecurringPosts,
          'kept_originals' => 'Original posts (is_recurring_instance = false) were preserved'
        ]);
      }
      
      // CRITICAL: Handle scheduled_at properly for both recurring and non-recurring publications
      // For recurring: scheduled_at is the BASE DATE for recurrence calculations
      // For non-recurring: scheduled_at is the actual publish date
      
      $accountSchedules = $data['social_account_schedules'] ?? $data['account_schedules'] ?? [];
      
      // PRIORITY 1: If we have account schedules, use the earliest as scheduled_at
      // This applies to BOTH recurring and non-recurring publications
      if (!empty($accountSchedules) && is_array($accountSchedules)) {
        $earliestDate = null;
        foreach ($accountSchedules as $accountId => $scheduleDate) {
          if (!empty($scheduleDate)) {
            $date = \Carbon\Carbon::parse($scheduleDate);
            if ($earliestDate === null || $date->lt($earliestDate)) {
              $earliestDate = $date;
            }
          }
        }
        
        if ($earliestDate !== null) {
          $updateData['scheduled_at'] = $earliestDate->toIso8601String();
          Log::info('UpdatePublicationAction: Using earliest account schedule as scheduled_at', [
            'publication_id' => $publication->id,
            'earliest_date' => $earliestDate->toIso8601String(),
            'is_recurring' => $isRecurring,
            'account_schedules_count' => count($accountSchedules),
          ]);
        }
      }
      // PRIORITY 2: If no account schedules but scheduled_at is empty, try to infer from scheduled_posts
      elseif (empty($updateData['scheduled_at']) || $updateData['scheduled_at'] === null) {
        $earliestScheduledPost = \App\Models\Social\ScheduledPost::where('publication_id', $publication->id)
          ->where('status', 'pending')
          ->where('is_recurring_instance', false) // Only consider original posts
          ->orderBy('scheduled_at', 'asc')
          ->first();
        
        if ($earliestScheduledPost) {
          $updateData['scheduled_at'] = $earliestScheduledPost->scheduled_at->toIso8601String();
          Log::info('UpdatePublicationAction: Using earliest original scheduled post as scheduled_at', [
            'publication_id' => $publication->id,
            'earliest_date' => $updateData['scheduled_at'],
            'is_recurring' => $isRecurring,
          ]);
        }
      }
      // PRIORITY 3: Keep existing scheduled_at if nothing else is provided
      else {
        Log::info('UpdatePublicationAction: Keeping existing scheduled_at', [
          'publication_id' => $publication->id,
          'scheduled_at' => $updateData['scheduled_at'],
          'is_recurring' => $isRecurring,
        ]);
      }

      Log::info('UpdatePublicationAction: About to update publication', [
        'publication_id' => $publication->id,
        'old_scheduled_at' => $publication->scheduled_at,
        'new_scheduled_at' => $updateData['scheduled_at'],
        'data_scheduled_at' => $data['scheduled_at'] ?? 'NOT SET',
      ]);

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

      Log::info('UpdatePublicationAction: Publication updated', [
        'publication_id' => $publication->id,
        'scheduled_at_after_update' => $publication->fresh()->scheduled_at,
      ]);

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

      // Log what we received
      Log::info('UpdatePublicationAction: Processing social accounts', [
        'publication_id' => $publication->id,
        'has_clear_flag' => array_key_exists('clear_social_accounts', $data),
        'clear_flag_value' => $data['clear_social_accounts'] ?? 'NOT SET',
        'has_social_accounts_key' => array_key_exists('social_accounts', $data),
        'social_accounts_raw' => $data['social_accounts'] ?? 'NOT SET',
        'social_accounts_type' => array_key_exists('social_accounts', $data) ? gettype($data['social_accounts']) : 'KEY NOT EXISTS',
      ]);

      // Check if we should clear all social accounts
      if (array_key_exists('clear_social_accounts', $data) && !empty($data['clear_social_accounts'])) {
        $socialAccounts = [];
        $shouldSyncSchedules = true;
        
        Log::info('UpdatePublicationAction: Clear flag detected, will delete all scheduled posts', [
          'publication_id' => $publication->id,
        ]);
      }
      // ONLY sync if social_accounts key exists in the request
      // This means the user explicitly interacted with the social accounts selector
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
          array_map(function ($id) {
            return $id === '' || $id === null ? null : intval($id);
          }, $socialAccounts),
          function ($id) {
            return $id !== null && $id > 0;
          }
        ));

        // Always sync when social_accounts is explicitly sent
        $shouldSyncSchedules = true;
        
        Log::info('UpdatePublicationAction: Social accounts processed', [
          'publication_id' => $publication->id,
          'processed_accounts' => $socialAccounts,
          'count' => count($socialAccounts),
        ]);
      }
      // If social_accounts is NOT in the request, don't touch schedules at all
      else {
        Log::info('UpdatePublicationAction: social_accounts key not in request, skipping sync', [
          'publication_id' => $publication->id,
        ]);
      }

      // Sync schedules if needed
      if ($shouldSyncSchedules) {
        // Detect if we need to recalculate all scheduled posts
        $forceRecalculate = false;
        
        // Use the captured original values (before update)
        
        // CASE 1: Recurrence was DISABLED (was true, now false)
        if ($oldIsRecurring && !$isRecurring) {
          // Count recurring instances before deletion
          $countRecurringBefore = \App\Models\Social\ScheduledPost::where('publication_id', $publication->id)
            ->where('status', 'pending')
            ->where('is_recurring_instance', true)
            ->count();
          
          Log::info('Recurrence disabled, deleting ONLY recurring instance posts', [
            'publication_id' => $publication->id,
            'title' => $publication->title,
            'old_is_recurring' => $oldIsRecurring,
            'new_is_recurring' => $isRecurring,
            'recurring_instances_count' => $countRecurringBefore
          ]);
          
          // Delete ONLY recurring instance posts (keep originals)
          $deletedCount = \App\Models\Social\ScheduledPost::where('publication_id', $publication->id)
            ->where('status', 'pending')
            ->where('is_recurring_instance', true)
            ->delete();
          
          // Verify deletion
          $countRecurringAfter = \App\Models\Social\ScheduledPost::where('publication_id', $publication->id)
            ->where('status', 'pending')
            ->where('is_recurring_instance', true)
            ->count();
          
          $countOriginalsAfter = \App\Models\Social\ScheduledPost::where('publication_id', $publication->id)
            ->where('status', 'pending')
            ->where('is_recurring_instance', false)
            ->count();
          
          Log::info('Deleted recurring instances after disabling recurrence', [
            'publication_id' => $publication->id,
            'recurring_before' => $countRecurringBefore,
            'deleted_count' => $deletedCount,
            'recurring_after' => $countRecurringAfter,
            'originals_preserved' => $countOriginalsAfter,
            'success' => $countRecurringAfter === 0
          ]);
          
          // Don't recalculate - we want to keep the original scheduled posts
          $forceRecalculate = false;
        }
        // CASE 2: Recurrence was ENABLED (was false, now true)
        elseif (!$oldIsRecurring && $isRecurring) {
          Log::info('Recurrence enabled, will create recurring posts', [
            'publication_id' => $publication->id
          ]);
          $forceRecalculate = true;
        }
        // CASE 3: Recurrence settings CHANGED (was recurring, still recurring, but settings changed)
        elseif ($isRecurring && $oldIsRecurring) {
          // CRITICAL: Unload the relationship first to force fresh load
          $publication->unsetRelation('recurrenceSettings');
          $newSettings = $publication->recurrenceSettings;
          
          if (
            $oldRecurrenceType != ($newSettings?->recurrence_type ?? 'daily') ||
            $oldRecurrenceInterval != ($newSettings?->recurrence_interval ?? 1) ||
            json_encode($oldRecurrenceDays) != json_encode($newSettings?->recurrence_days ?? []) ||
            $oldRecurrenceEndDate != $newSettings?->recurrence_end_date
          ) {
            Log::info('Recurrence settings changed, recalculating posts', [
              'publication_id' => $publication->id,
              'old_type' => $oldRecurrenceType,
              'new_type' => $newSettings?->recurrence_type,
              'old_end_date' => $oldRecurrenceEndDate,
              'new_end_date' => $newSettings?->recurrence_end_date,
            ]);
            $forceRecalculate = true;
          }
        }
        
        // CASE 4: Scheduled date CHANGED (for both recurring and non-recurring)
        if ($oldScheduledAt != $updateData['scheduled_at']) {
          Log::info('Scheduled date changed, recalculating posts', [
            'publication_id' => $publication->id,
            'old_date' => $oldScheduledAt,
            'new_date' => $updateData['scheduled_at']
          ]);
          $forceRecalculate = true;
        }

        // Only sync schedules if we haven't disabled recurrence
        if ($shouldSyncSchedules) {
          // CRITICAL: Force complete refresh from database
          // 1. Unload the recurrenceSettings relationship to clear any cached data
          $publication->unsetRelation('recurrenceSettings');
          // 2. Refresh the entire model from database
          $publication->refresh();
          
          \Log::info('UpdatePublicationAction: About to sync schedules with fresh data', [
            'publication_id' => $publication->id,
            'recurrence_end_date' => $publication->recurrenceSettings?->recurrence_end_date ?? 'NULL',
            'is_recurring' => $publication->is_recurring,
          ]);
          
          $this->schedulingService->syncSchedules(
            $publication,
            $socialAccounts,
            $data['social_account_schedules'] ?? $data['account_schedules'] ?? [],
            $forceRecalculate
          );
        }
      }

      // Broadcast update to other users in the workspace
      PublicationUpdated::dispatch($publication);

      return $publication;
    });
  }

  /**
   * Check if there are files currently being uploaded
   */
  private function hasUploadingFiles(array $newFiles): bool
  {
    foreach ($newFiles as $file) {
      // Check if it's a file being uploaded (UploadedFile)
      if (is_object($file) && method_exists($file, 'isValid')) {
        return true;
      }
      
      // Check if it's metadata indicating upload in progress
      if (is_array($file) && isset($file['status'])) {
        $status = $file['status'];
        if (in_array($status, ['uploading', 'processing', 'pending', 'transcoding'])) {
          return true;
        }
      }
      
      // Check if it's a temporary upload
      if (is_array($file) && isset($file['temp_id']) && !isset($file['media_file_id'])) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Determine if content type change should be auto-applied
   */
  private function shouldAutoApplyContentTypeChange(string $currentType, string $suggestedType): bool
  {
    // Auto-apply changes based on video duration constraints
    $autoApplyRules = [
      // From story to reel/post based on duration
      'story' => ['reel', 'post'],
      // From reel to post based on duration
      'reel' => ['post'],
      // From post to reel/story if duration allows (less common but possible)
      'post' => ['reel', 'story']
    ];
    
    return isset($autoApplyRules[$currentType]) && 
           in_array($suggestedType, $autoApplyRules[$currentType]);
  }
}
