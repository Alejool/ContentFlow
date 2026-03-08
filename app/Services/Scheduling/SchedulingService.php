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

    // If forceRecalculate is true, delete all pending scheduled posts for these accounts
    // This happens when recurrence settings or scheduled_at changes
    if ($forceRecalculate) {
      $deletedCount = ScheduledPost::where('publication_id', $publication->id)
        ->where('status', 'pending')
        ->whereIn('social_account_id', $accountIds)
        ->delete();
      
      \Log::info('Force recalculate: deleted pending posts', [
        'publication_id' => $publication->id,
        'account_ids' => $accountIds,
        'deleted_count' => $deletedCount
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
    $recurrenceAccountIds = $publication->recurrence_accounts;
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

      // Determine the effective base date for THIS account (most specific wins):
      // 1. Per-account schedule override from frontend (most specific)
      // 2. The account's own published_at from its social_post_log (exact publish time)
      // 3. The original scheduled_at from the ScheduledPost marked as 'posted'
      // 4. The publication's global scheduled_at
      // 5. The publication's published_at / publish_date
      
      $accountLog = $publishedLogs[$accountId] ?? null;
      $accountLogDate = $accountLog?->published_at ?? null;

      $postedSchedule = $postedSchedules[$accountId] ?? null;
      $postedScheduleDate = $postedSchedule?->scheduled_at ?? null;

      $accountScheduleDate = isset($accountSchedules[$accountId]) ? $accountSchedules[$accountId] : null;

      $accountBase = $accountScheduleDate  // Use account-specific schedule first
        ?? $accountLogDate
        ?? $postedScheduleDate
        ?? $globalSchedule
        ?? $publicationFallback;

      if ($shouldHaveRecurrence && $accountBase) {
        // Calculate recurrence dates using this account's specific base date
        $specificDates = $this->calculateRecurrenceDatesFromBase($publication, $accountBase);
        
        // IMPORTANT: For the base date, check if it's in the future
        // If the base date is in the past, don't include it (start from today)
        $baseDateCarbon = Carbon::parse($accountBase);
        $now = now();
        
        // Only add base date if it's in the future (with 5-min grace period)
        if ($baseDateCarbon->greaterThanOrEqualTo($now->subMinutes(5))) {
          array_unshift($specificDates, $accountBase);
        }
        // If base date is in the past and no future dates calculated, start from today
        elseif (empty($specificDates)) {
          // Recalculate from today instead of the old base date
          $specificDates = $this->calculateRecurrenceDatesFromBase($publication, now());
        }
      } else {
        // Not recurring: use the single effective date for this account
        $specificDates = [$accountBase];
      }

      foreach ($specificDates as $scheduledAt) {
        if (!$scheduledAt) {
          continue;
        }

        // When forceRecalculate is true, always create new posts (old ones were deleted)
        if ($forceRecalculate) {
          ScheduledPost::create([
            'publication_id' => $publication->id,
            'social_account_id' => $accountId,
            'status' => 'pending',
            'user_id' => Auth::id() ?? $publication->user_id,
            'workspace_id' => $publication->workspace_id,
            'scheduled_at' => $scheduledAt,
            'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
            'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
          ]);
        } else {
          // Normal flow: check if post exists before creating
          $existingPost = ScheduledPost::where('publication_id', $publication->id)
            ->where('social_account_id', $accountId)
            ->where('scheduled_at', $scheduledAt)
            ->where('status', 'pending')
            ->first();

          if ($existingPost) {
            $existingPost->update([
              'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
              'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
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

    $dates = [];
    $startDate = Carbon::parse($baseDate);
    $endDate = $publication->recurrence_end_date ? Carbon::parse($publication->recurrence_end_date) : null;
    $interval = max(1, (int)($publication->recurrence_interval ?? 1));
    $now = now();

    // Default limit: 3 months if no end date
    if (!$endDate) {
      $endDate = now()->addMonths(3);
    }

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

      switch ($publication->recurrence_type) {
        case 'daily':
          $currentDate->addDays((int)$interval);
          break;
        case 'weekly':
          if (!empty($publication->recurrence_days)) {
            $currentDay = $currentDate->dayOfWeek;
            $nextDay = null;

            $sortedDays = array_map('intval', $publication->recurrence_days);
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
    }

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
