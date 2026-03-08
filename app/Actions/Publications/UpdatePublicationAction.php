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
        'hashtags' => $data['hashtags'] ?? $publication->hashtags,
        'goal' => $data['goal'] ?? $publication->goal,
        'start_date' => $data['start_date'] ?? $publication->start_date,
        'end_date' => $data['end_date'] ?? $publication->end_date,
        'status' => $newStatus,
        'scheduled_at' => $data['scheduled_at'] ?? $publication->scheduled_at,
        'is_recurring' => $isRecurring,
      ];
      
      // Handle recurrence settings in separate table
      if ($isRecurring) {
        $recurrenceData = [
          'recurrence_type' => $data['recurrence_type'] ?? $publication->recurrenceSettings?->recurrence_type ?? 'daily',
          'recurrence_interval' => (int)($data['recurrence_interval'] ?? $publication->recurrenceSettings?->recurrence_interval ?? 1),
          'recurrence_days' => array_key_exists('recurrence_days', $data) ? $data['recurrence_days'] : ($publication->recurrenceSettings?->recurrence_days ?? []),
          'recurrence_end_date' => $data['recurrence_end_date'] ?? $publication->recurrenceSettings?->recurrence_end_date ?? null,
          'recurrence_accounts' => $data['recurrence_accounts'] ?? $publication->recurrenceSettings?->recurrence_accounts ?? null,
        ];
        
        // Update or create recurrence settings
        $publication->recurrenceSettings()->updateOrCreate(
          ['publication_id' => $publication->id],
          $recurrenceData
        );
      } else {
        // Delete recurrence settings if recurrence is disabled
        $publication->recurrenceSettings()->delete();
        
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
      
      // CRITICAL: For recurring publications, NEVER change scheduled_at after creation
      // The scheduled_at is the BASE DATE and must remain invariable
      // Only update scheduled_at if:
      // 1. Publication is NOT recurring, OR
      // 2. We explicitly received a new scheduled_at in the request
      
      $shouldUpdateScheduledAt = false;
      
      // If we have account schedules in the request, use the earliest
      // BUT ONLY for non-recurring publications
      $accountSchedules = $data['social_account_schedules'] ?? $data['account_schedules'] ?? [];
      
      if (!empty($accountSchedules) && is_array($accountSchedules) && !$isRecurring) {
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
          $shouldUpdateScheduledAt = true;
          Log::info('UpdatePublicationAction: Using earliest account schedule as scheduled_at', [
            'publication_id' => $publication->id,
            'earliest_date' => $earliestDate->toIso8601String(),
            'is_recurring' => false,
          ]);
        }
      }
      // For recurring publications with account schedules, keep the base date
      elseif (!empty($accountSchedules) && is_array($accountSchedules) && $isRecurring) {
        Log::info('UpdatePublicationAction: Ignoring account schedules for recurring publication', [
          'publication_id' => $publication->id,
          'scheduled_at' => $publication->scheduled_at,
          'reason' => 'Recurring publications must keep their base date invariable',
        ]);
      }
      // If no account schedules and no scheduled_at in request, try to infer from scheduled_posts
      // ALWAYS use the earliest ORIGINAL post (is_recurring_instance = false) as the base date
      elseif (empty($updateData['scheduled_at']) || $updateData['scheduled_at'] === null) {
        $earliestScheduledPost = \App\Models\Social\ScheduledPost::where('publication_id', $publication->id)
          ->where('status', 'pending')
          ->where('is_recurring_instance', false) // Only consider original posts
          ->orderBy('scheduled_at', 'asc')
          ->first();
        
        if ($earliestScheduledPost) {
          $updateData['scheduled_at'] = $earliestScheduledPost->scheduled_at->toIso8601String();
          $shouldUpdateScheduledAt = true;
          Log::info('UpdatePublicationAction: Using earliest original scheduled post as scheduled_at', [
            'publication_id' => $publication->id,
            'earliest_date' => $updateData['scheduled_at'],
            'is_recurring' => $isRecurring,
          ]);
        }
      }
      // For recurring publications, keep the existing scheduled_at (base date)
      elseif ($isRecurring && !empty($publication->scheduled_at)) {
        Log::info('UpdatePublicationAction: Preserving base date for recurring publication', [
          'publication_id' => $publication->id,
          'scheduled_at' => $publication->scheduled_at,
          'reason' => 'Recurring publications must keep their base date invariable',
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

      // Check if we should clear all social accounts
      if (array_key_exists('clear_social_accounts', $data) && !empty($data['clear_social_accounts'])) {
        $socialAccounts = [];
        $shouldSyncSchedules = true;
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
      }
      // If social_accounts is NOT in the request, don't touch schedules at all

      // Sync schedules if needed
      if ($shouldSyncSchedules) {
        // Detect if we need to recalculate all scheduled posts
        $forceRecalculate = false;
        
        // Use the captured original values (before update)
        
        // CASE 1: Recurrence was DISABLED (was true, now false)
        if ($oldIsRecurring && !$isRecurring) {
          // First, count how many posts we have before deletion
          $countBefore = \App\Models\Social\ScheduledPost::where('publication_id', $publication->id)
            ->where('status', 'pending')
            ->count();
          
          Log::info('Recurrence disabled, deleting ALL scheduled posts', [
            'publication_id' => $publication->id,
            'title' => $publication->title,
            'old_is_recurring' => $oldIsRecurring,
            'new_is_recurring' => $isRecurring,
            'pending_posts_count' => $countBefore
          ]);
          
          // Delete ALL pending scheduled posts
          $deletedCount = \App\Models\Social\ScheduledPost::where('publication_id', $publication->id)
            ->where('status', 'pending')
            ->delete();
          
          // Verify deletion
          $countAfter = \App\Models\Social\ScheduledPost::where('publication_id', $publication->id)
            ->where('status', 'pending')
            ->count();
          
          Log::info('Deleted all scheduled posts after disabling recurrence', [
            'publication_id' => $publication->id,
            'count_before' => $countBefore,
            'deleted_count' => $deletedCount,
            'count_after' => $countAfter,
            'success' => $countAfter === 0
          ]);
          
          // Don't create any new posts - calendar should be clean
          $shouldSyncSchedules = false;
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
          $newSettings = $publication->fresh()->recurrenceSettings;
          if (
            $oldRecurrenceType != ($newSettings?->recurrence_type ?? 'daily') ||
            $oldRecurrenceInterval != ($newSettings?->recurrence_interval ?? 1) ||
            json_encode($oldRecurrenceDays) != json_encode($newSettings?->recurrence_days ?? []) ||
            $oldRecurrenceEndDate != $newSettings?->recurrence_end_date
          ) {
            Log::info('Recurrence settings changed, recalculating posts', [
              'publication_id' => $publication->id,
              'old_type' => $oldRecurrenceType,
              'new_type' => $newSettings?->recurrence_type
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
}
