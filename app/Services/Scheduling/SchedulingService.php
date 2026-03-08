<?php

namespace App\Services\Scheduling;

use App\Models\Publications\Publication;
use App\Models\Social\ScheduledPost;
use App\Models\Social\SocialAccount;
use App\Models\Social\SocialPostLog;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class SchedulingService
{
  public function scheduleForAccounts(Publication $publication, array $accountIds, array $accountSchedules = [], bool $forceRecalculate = false): void
  {
    $globalSchedule = $publication->scheduled_at;

    // If forceRecalculate is true, delete ONLY recurring instance posts (not originals)
    // This happens when recurrence settings or scheduled_at changes
    // IMPORTANT: Never delete original posts (is_recurring_instance = false)
    if ($forceRecalculate) {
      $deletedCount = ScheduledPost::where('publication_id', $publication->id)
        ->where('status', 'pending')
        ->where('is_recurring_instance', true) // Only delete recurring instances
        ->whereIn('social_account_id', $accountIds)
        ->delete();
      
      \Log::info('Force recalculate: deleted recurring instance posts', [
        'publication_id' => $publication->id,
        'account_ids' => $accountIds,
        'deleted_count' => $deletedCount,
        'kept_originals' => 'Original posts (is_recurring_instance = false) were preserved'
      ]);
    }

    // Pre-load the latest published log per social account for this publication.
    // This is the most accurate base date: the exact moment each account was published.
    $publishedLogs = SocialPostLog::where('publication_id', $publication->id)
      ->where('status', 'published')
      ->whereIn('social_account_id', $accountIds)
      ->orderBy('id', 'desc')
      ->get()
      ->keyBy('social_account_id');

    // Pre-load previously 'posted' ScheduledPosts (marked as posted when publishing started).
    // Fallback when log.published_at is null — the original scheduled_at is reliable.
    $postedSchedules = ScheduledPost::where('publication_id', $publication->id)
      ->where('status', 'posted')
      ->whereIn('social_account_id', $accountIds)
      ->orderBy('id', 'desc')
      ->get()
      ->keyBy('social_account_id');

    // Publication-level fallback dates (in order of preference)
    $publicationFallback = $globalSchedule
      ?? $publication->published_at
      ?? ($publication->publish_date ? Carbon::parse($publication->publish_date) : null);

    $socialAccounts = SocialAccount::whereIn('id', $accountIds)->get()->keyBy('id');

    // Determine which accounts should have recurrence
    // If recurrence_accounts is null or empty, all selected accounts get recurrence
    // Otherwise, only accounts in recurrence_accounts array get recurrence
    $settings = $publication->recurrenceSettings;
    $recurrenceAccountIds = $settings ? $settings->recurrence_accounts : $publication->recurrence_accounts;
    $accountsWithRecurrence = [];
    
    if ($publication->is_recurring) {
      if (empty($recurrenceAccountIds)) {
        // All accounts get recurrence
        $accountsWithRecurrence = $accountIds;
      } else {
        // Only specified accounts get recurrence
        $accountsWithRecurrence = array_intersect($accountIds, $recurrenceAccountIds);
      }
    }

    foreach ($accountIds as $accountId) {
      $socialAccount = $socialAccounts[$accountId] ?? null;
      
      // Check if this account should have recurrence
      $shouldHaveRecurrence = in_array($accountId, $accountsWithRecurrence);
      
      \Log::info('SchedulingService: Processing account', [
        'publication_id' => $publication->id,
        'account_id' => $accountId,
        'is_recurring' => $publication->is_recurring,
        'should_have_recurrence' => $shouldHaveRecurrence,
        'accounts_with_recurrence' => $accountsWithRecurrence,
      ]);

      // Determine the effective base date for THIS account (most specific wins):
      // 1. Per-account schedule override from frontend (most specific)
      // 2. The account's own published_at from its social_post_log (exact publish time)
      // 3. The original scheduled_at from the ScheduledPost marked as 'posted' or 'pending'
      // IMPORTANT: DO NOT use publication's global scheduled_at - each account has its own date
      
      $accountLog = $publishedLogs[$accountId] ?? null;
      $accountLogDate = $accountLog?->published_at ?? null;

      $postedSchedule = $postedSchedules[$accountId] ?? null;
      $postedScheduleDate = $postedSchedule?->scheduled_at ?? null;
      
      // Also check for pending scheduled posts (not yet published)
      $pendingSchedule = ScheduledPost::where('publication_id', $publication->id)
        ->where('social_account_id', $accountId)
        ->where('status', 'pending')
        ->where('is_recurring_instance', false) // Only original posts
        ->orderBy('scheduled_at', 'asc')
        ->first();
      $pendingScheduleDate = $pendingSchedule?->scheduled_at ?? null;

      $accountScheduleDate = isset($accountSchedules[$accountId]) ? $accountSchedules[$accountId] : null;

      // Priority order (DO NOT use global scheduled_at):
      // 1. Account-specific schedule from request
      // 2. Published date from log
      // 3. Posted schedule date
      // 4. Pending schedule date
      $accountBase = $accountScheduleDate
        ?? $accountLogDate
        ?? $postedScheduleDate
        ?? $pendingScheduleDate;
      
      \Log::info('SchedulingService: Determined base date for account', [
        'publication_id' => $publication->id,
        'account_id' => $accountId,
        'account_schedule_date' => $accountScheduleDate,
        'account_log_date' => $accountLogDate,
        'posted_schedule_date' => $postedScheduleDate,
        'pending_schedule_date' => $pendingScheduleDate,
        'final_base_date' => $accountBase,
      ]);

      // CRITICAL: Check if this account was already published
      // This must be defined BEFORE any conditional blocks that use it
      $wasAlreadyPublished = isset($publishedLogs[$accountId]);

      if ($shouldHaveRecurrence && $accountBase) {
        // Calculate recurrence dates using this account's specific base date
        $specificDates = $this->calculateRecurrenceDatesFromBase($publication, $accountBase);
        
        \Log::info('SchedulingService: Calculating recurrence dates', [
          'publication_id' => $publication->id,
          'account_id' => $accountId,
          'should_have_recurrence' => $shouldHaveRecurrence,
          'base_date' => $accountBase,
          'calculated_dates_count' => count($specificDates),
        ]);
        
        // IMPORTANT: For the base date, check if it's in the future
        // If the base date is in the past, don't include it (already published)
        // Only create scheduled posts for FUTURE recurrence dates
        $baseDateCarbon = Carbon::parse($accountBase);
        $now = now();
        
        // CRITICAL: If this account was already published (has a published log),
        // DO NOT create a scheduled post for the base date - it's already done!
        // Only create scheduled posts for the FUTURE recurrence dates
        
        if ($wasAlreadyPublished) {
          \Log::info('SchedulingService: Account already published, skipping base date', [
            'publication_id' => $publication->id,
            'account_id' => $accountId,
            'base_date' => $accountBase,
            'published_at' => $accountLog?->published_at,
            'future_dates_count' => count($specificDates),
          ]);
          // Don't add base date - it was already published
          // $specificDates already contains only future dates from calculateRecurrenceDatesFromBase
        }
        // Only add base date if it's in the future AND not already published
        elseif ($baseDateCarbon->greaterThanOrEqualTo($now->subMinutes(5))) {
          array_unshift($specificDates, $accountBase);
          \Log::info('SchedulingService: Added base date to beginning (not yet published)', [
            'base_date' => $accountBase,
            'total_dates' => count($specificDates),
          ]);
        }
        // If base date is in the past and no future dates calculated, start from today
        elseif (empty($specificDates)) {
          // Recalculate from today instead of the old base date
          $specificDates = $this->calculateRecurrenceDatesFromBase($publication, now());
          \Log::info('SchedulingService: Base date in past, recalculated from today', [
            'recalculated_dates_count' => count($specificDates),
          ]);
        }
      } else {
        // Not recurring: use the single effective date for this account
        $specificDates = [$accountBase];
        
        \Log::info('SchedulingService: Not recurring, using single date', [
          'publication_id' => $publication->id,
          'account_id' => $accountId,
          'should_have_recurrence' => $shouldHaveRecurrence,
          'date' => $accountBase,
        ]);
      }

      foreach ($specificDates as $index => $scheduledAt) {
        if (!$scheduledAt) {
          continue;
        }

        // Determine if this is a recurring instance
        // CRITICAL: If the account was already published, ALL new scheduled posts are recurring instances
        // Otherwise: The first date (index 0) is the original/base date (not a recurring instance)
        // All subsequent dates are recurring instances
        $isRecurringInstance = $shouldHaveRecurrence && ($wasAlreadyPublished || $index > 0);
        
        \Log::info('SchedulingService: Creating scheduled post', [
          'publication_id' => $publication->id,
          'account_id' => $accountId,
          'scheduled_at' => $scheduledAt,
          'index' => $index,
          'should_have_recurrence' => $shouldHaveRecurrence,
          'is_recurring_instance' => $isRecurringInstance,
        ]);

        // When forceRecalculate is true, we deleted recurring instances but kept originals
        // So we need to check if an original post exists before creating
        if ($forceRecalculate) {
          // CRITICAL: If account was already published, don't look for or update "original" posts
          // All scheduled posts for published accounts should be recurring instances
          if (!$wasAlreadyPublished && $index === 0) {
            // Only check for existing original if NOT published yet
            $existingOriginal = ScheduledPost::where('publication_id', $publication->id)
              ->where('social_account_id', $accountId)
              ->where('is_recurring_instance', false)
              ->where('status', 'pending')
              ->first();
            
            if ($existingOriginal) {
              // Update the existing original post
              $existingOriginal->update([
                'scheduled_at' => $scheduledAt,
                'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
                'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
              ]);
              
              \Log::info('SchedulingService: Updated existing original post', [
                'post_id' => $existingOriginal->id,
                'scheduled_at' => $scheduledAt,
              ]);
              continue; // Skip to next iteration
            }
          }
          
          // Create new post (either recurring instance or new original)
          $createdPost = ScheduledPost::create([
            'publication_id' => $publication->id,
            'social_account_id' => $accountId,
            'status' => 'pending',
            'user_id' => Auth::id() ?? $publication->user_id,
            'workspace_id' => $publication->workspace_id,
            'scheduled_at' => $scheduledAt,
            'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
            'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
            'is_recurring_instance' => $isRecurringInstance,
          ]);
          
          \Log::info('SchedulingService: Created new post', [
            'post_id' => $createdPost->id,
            'scheduled_at' => $scheduledAt,
            'is_recurring_instance' => $isRecurringInstance,
            'index' => $index,
            'was_already_published' => $wasAlreadyPublished,
          ]);
        } else {
          // Normal flow: check if post exists before creating
          $existingPost = ScheduledPost::where('publication_id', $publication->id)
            ->where('social_account_id', $accountId)
            ->where('scheduled_at', $scheduledAt)
            ->where('status', 'pending')
            ->first();

          if ($existingPost) {
            // CRITICAL: If account was already published, force is_recurring_instance to true
            // even if the existing post has it as false
            $finalIsRecurringInstance = $wasAlreadyPublished ? true : $isRecurringInstance;
            
            $existingPost->update([
              'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
              'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
              'is_recurring_instance' => $finalIsRecurringInstance,
            ]);
            
            \Log::info('SchedulingService: Updated existing post', [
              'post_id' => $existingPost->id,
              'scheduled_at' => $scheduledAt,
              'was_already_published' => $wasAlreadyPublished,
              'is_recurring_instance' => $finalIsRecurringInstance,
            ]);
          } else {
            ScheduledPost::create([
              'publication_id' => $publication->id,
              'social_account_id' => $accountId,
              'status' => 'pending',
              'user_id' => Auth::id() ?? $publication->user_id,
              'workspace_id' => $publication->workspace_id,
              'scheduled_at' => $scheduledAt,
              'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
              'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
              'is_recurring_instance' => $isRecurringInstance,
            ]);
            
            \Log::info('SchedulingService: Created new post', [
              'scheduled_at' => $scheduledAt,
              'is_recurring_instance' => $isRecurringInstance,
              'was_already_published' => $wasAlreadyPublished,
            ]);
          }
        }
      }
    }

    // Cleanup: Remove pending schedules for accounts that are no longer selected
    // ONLY if accountIds were explicitly provided (not empty on purpose to keep existing)
    if (!empty($accountIds)) {
      // Remove schedules for accounts that are no longer in the list
      ScheduledPost::where('publication_id', $publication->id)
        ->where('status', 'pending')
        ->whereNotIn('social_account_id', $accountIds)
        ->delete();
    }
    
    // CRITICAL: If recurrence is enabled and we have an end date, remove any recurring posts
    // that are scheduled AFTER the end date (this handles when user reduces the end date)
    if ($publication->is_recurring) {
      $settings = $publication->recurrenceSettings;
      $recurrenceEndDate = $settings ? $settings->recurrence_end_date : $publication->recurrence_end_date;
      
      if ($recurrenceEndDate) {
        $endDateCarbon = Carbon::parse($recurrenceEndDate)->endOfDay();
        
        $deletedOutOfRange = ScheduledPost::where('publication_id', $publication->id)
          ->where('status', 'pending')
          ->where('is_recurring_instance', true)
          ->whereIn('social_account_id', $accountIds)
          ->where('scheduled_at', '>', $endDateCarbon)
          ->delete();
        
        if ($deletedOutOfRange > 0) {
          \Log::info('Deleted recurring posts outside new end date range', [
            'publication_id' => $publication->id,
            'end_date' => $recurrenceEndDate,
            'deleted_count' => $deletedOutOfRange,
          ]);
        }
      }
    }
    
    // If accountIds is explicitly empty AND we want to clear (check if this is intentional)
    // We don't automatically delete - let syncSchedules handle this logic
  }

  public function syncSchedules(Publication $publication, array $accountIds, array $accountSchedules = [], bool $forceRecalculate = false): void
  {
    // If accountIds is empty but there are existing scheduled posts,
    // get the accounts from existing posts to avoid accidental deletion
    if (empty($accountIds)) {
      $existingAccounts = ScheduledPost::where('publication_id', $publication->id)
        ->where('status', 'pending')
        ->distinct()
        ->pluck('social_account_id')
        ->toArray();
      
      // If there are existing posts and no accounts provided, keep existing accounts
      if (!empty($existingAccounts)) {
        $accountIds = $existingAccounts;
      }
    }

    $this->scheduleForAccounts($publication, $accountIds, $accountSchedules, $forceRecalculate);

    // Refresh to get updated scheduled_posts count
    $publication->refresh();

    // Check if there are any pending schedules
    $hasPending = $publication->scheduled_posts()->where('status', 'pending')->exists();

    // Only clear schedules if explicitly requested (accountIds is empty AND no existing posts)
    if (empty($accountIds) && !$hasPending) {
      // Delete all pending schedules
      ScheduledPost::where('publication_id', $publication->id)
        ->where('status', 'pending')
        ->delete();
      
      // Clear scheduled_at and revert to draft
      $updateData = ['scheduled_at' => null];

      // Only change status if it's currently scheduled
      if (in_array($publication->status, ['scheduled', 'approved'])) {
        $updateData['status'] = 'draft';
      }

      $publication->update($updateData);
    }
    // If there are pending schedules or accounts, ensure status is scheduled
    elseif (($hasPending || !empty($accountIds)) && $publication->status === 'draft') {
      $publication->logActivity('scheduled');
      $publication->update(['status' => 'scheduled']);
    }
  }

  /**
   * Calculate future recurrence dates for a publication given a specific base date.
   * The base date is the original publish/schedule time for a particular social account.
   * 
   * IMPORTANT: This function returns ONLY the recurring dates AFTER the base date.
   * The base date itself should be added separately by the caller.
   * 
   * If the base date is in the past, this function will skip past dates and only
   * return future dates.
   * 
   * Example: If base date is Jan 16 and recurrence is daily:
   * - This function returns: [Jan 17, Jan 18, Jan 19, ...]
   * - The caller should add Jan 16 as the first post (if it's in the future)
   */
  protected function calculateRecurrenceDatesFromBase(Publication $publication, $baseDate): array
  {
    if (!$baseDate) {
      return [];
    }

    // Get recurrence settings from the relationship
    $settings = $publication->recurrenceSettings;
    
    if (!$settings) {
      // Fallback to old fields if settings don't exist yet
      $recurrenceType = $publication->recurrence_type;
      $recurrenceInterval = $publication->recurrence_interval;
      $recurrenceDays = $publication->recurrence_days;
      $recurrenceEndDate = $publication->recurrence_end_date;
    } else {
      $recurrenceType = $settings->recurrence_type;
      $recurrenceInterval = $settings->recurrence_interval;
      $recurrenceDays = $settings->recurrence_days;
      $recurrenceEndDate = $settings->recurrence_end_date;
    }

    \Log::info('calculateRecurrenceDatesFromBase: Starting calculation', [
      'publication_id' => $publication->id,
      'base_date' => $baseDate,
      'recurrence_type' => $recurrenceType,
      'recurrence_interval' => $recurrenceInterval,
      'recurrence_end_date' => $recurrenceEndDate,
    ]);

    $dates = [];
    $startDate = Carbon::parse($baseDate);
    $endDate = $recurrenceEndDate ? Carbon::parse($recurrenceEndDate)->endOfDay() : null;
    $interval = max(1, (int)($recurrenceInterval ?? 1));
    $now = now();

    // Default limit: 3 months if no end date
    if (!$endDate) {
      $endDate = now()->addMonths(3);
    }

    \Log::info('calculateRecurrenceDatesFromBase: Date range', [
      'start_date' => $startDate->toIso8601String(),
      'end_date' => $endDate->toIso8601String(),
      'interval' => $interval,
    ]);

    $currentDate = clone $startDate;

    // Limit to 50 occurrences to avoid memory/timeout issues
    $count = 0;
    $addedCount = 0;
    
    while ($currentDate->lessThanOrEqualTo($endDate) && $addedCount < 50) {
      $count++;

      // Skip the first iteration (base date will be added by the caller)
      if ($count > 1) {
        // Only include future dates (allow 5-min grace period for dates that just passed)
        if ($currentDate->greaterThanOrEqualTo($now->copy()->subMinutes(5))) {
          $dates[] = $currentDate->toIso8601String();
          $addedCount++;
          \Log::info('calculateRecurrenceDatesFromBase: Added date', [
            'date' => $currentDate->toIso8601String(),
            'count' => $count,
            'added_count' => $addedCount,
          ]);
        } else {
          \Log::info('calculateRecurrenceDatesFromBase: Skipped past date', [
            'date' => $currentDate->toIso8601String(),
            'now' => $now->toIso8601String(),
          ]);
        }
      }

      // Safety check to prevent infinite loops
      if ($count > 1000) {
        \Log::warning('Recurrence calculation exceeded 1000 iterations', [
          'publication_id' => $publication->id,
          'base_date' => $baseDate,
          'current_date' => $currentDate->toIso8601String()
        ]);
        break;
      }

      switch ($recurrenceType) {
        case 'daily':
          $currentDate->addDays((int)$interval);
          break;
        case 'weekly':
          if (!empty($recurrenceDays)) {
            $currentDay = $currentDate->dayOfWeek;
            $nextDay = null;

            $sortedDays = array_map('intval', $recurrenceDays);
            sort($sortedDays);

            foreach ($sortedDays as $day) {
              if ($day > $currentDay) {
                $nextDay = $day;
                break;
              }
            }

            if ($nextDay !== null) {
              $currentDate->addDays((int)($nextDay - $currentDay));
            } else {
              $nextDay = $sortedDays[0];
              $currentDate->subDays((int)$currentDay)->addWeeks((int)$interval)->addDays((int)$nextDay);
            }
          } else {
            $currentDate->addWeeks((int)$interval);
          }
          break;
        case 'monthly':
          $currentDate->addMonths((int)$interval);
          break;
        case 'yearly':
          $currentDate->addYears((int)$interval);
          break;
      }
      
      \Log::info('calculateRecurrenceDatesFromBase: After increment', [
        'new_date' => $currentDate->toIso8601String(),
        'end_date' => $endDate->toIso8601String(),
        'is_within_range' => $currentDate->lessThanOrEqualTo($endDate),
      ]);
    }

    \Log::info('calculateRecurrenceDatesFromBase: Finished', [
      'total_dates' => count($dates),
      'dates' => $dates,
    ]);

    return $dates;
  }

  /**
   * Calculate future dates for a recurring publication.
   * Kept for backward compatibility — uses publication-level date as base.
   */
  protected function calculateRecurrenceDates(Publication $publication): array
  {
    $baseDate = $publication->scheduled_at
      ?? $publication->published_at
      ?? ($publication->publish_date ? Carbon::parse($publication->publish_date) : null);

    return $this->calculateRecurrenceDatesFromBase($publication, $baseDate);
  }
}
