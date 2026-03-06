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
  public function scheduleForAccounts(Publication $publication, array $accountIds, array $accountSchedules = []): void
  {
    $globalSchedule = $publication->scheduled_at;

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

    foreach ($accountIds as $accountId) {
      $socialAccount = $socialAccounts[$accountId] ?? null;

      // Determine the effective base date for THIS account (most specific wins):
      // 1. The account's own published_at from its social_post_log (exact publish time)
      // 2. The original scheduled_at from the ScheduledPost marked as 'posted'
      // 3. A per-account schedule override passed from the frontend
      // 4. The publication's global scheduled_at
      // 5. The publication's published_at / publish_date
      $accountLog = $publishedLogs[$accountId] ?? null;
      $accountLogDate = $accountLog?->published_at ?? null;

      $postedSchedule = $postedSchedules[$accountId] ?? null;
      $postedScheduleDate = $postedSchedule?->scheduled_at ?? null;

      $accountScheduleDate = isset($accountSchedules[$accountId]) ? $accountSchedules[$accountId] : null;

      $accountBase = $accountLogDate
        ?? $postedScheduleDate
        ?? $accountScheduleDate
        ?? $globalSchedule
        ?? $publicationFallback;

      if ($publication->is_recurring && $accountBase) {
        // Calculate recurrence dates using this account's specific base date
        $specificDates = $this->calculateRecurrenceDatesFromBase($publication, $accountBase);
      } else {
        // Not recurring: use the single effective date for this account
        $specificDates = [$accountBase];
      }

      foreach ($specificDates as $scheduledAt) {
        if (!$scheduledAt) {
          continue;
        }

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

    // Cleanup: Remove pending schedules for accounts that are no longer selected
    if (empty($accountIds)) {
      ScheduledPost::where('publication_id', $publication->id)
        ->where('status', 'pending')
        ->delete();
    } else {
      ScheduledPost::where('publication_id', $publication->id)
        ->where('status', 'pending')
        ->whereNotIn('social_account_id', $accountIds)
        ->delete();
    }
  }

  public function syncSchedules(Publication $publication, array $accountIds, array $accountSchedules = []): void
  {
    $this->scheduleForAccounts($publication, $accountIds, $accountSchedules);

    // Refresh to get updated scheduled_posts count
    $publication->refresh();

    // Check if there are any pending schedules
    $hasPending = $publication->scheduled_posts()->where('status', 'pending')->exists();

    // If no pending schedules and no accounts selected, clear scheduled_at and revert to draft
    if (!$hasPending && empty($accountIds)) {
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
   */
  protected function calculateRecurrenceDatesFromBase(Publication $publication, $baseDate): array
  {
    if (!$baseDate) {
      return [];
    }

    $dates = [];
    $startDate = Carbon::parse($baseDate);
    $endDate = $publication->recurrence_end_date ? Carbon::parse($publication->recurrence_end_date) : null;
    $interval = max(1, $publication->recurrence_interval ?? 1);

    // Default limit: 3 months if no end date
    if (!$endDate) {
      $endDate = now()->addMonths(3);
    }

    $currentDate = clone $startDate;

    // Limit to 50 occurrences to avoid memory/timeout issues
    $count = 0;
    while ($currentDate->lessThanOrEqualTo($endDate) && $count < 50) {
      // Only include future dates (allow 5-min grace period for dates that just passed)
      if ($currentDate->greaterThanOrEqualTo(now()->subMinutes(5))) {
        $dates[] = $currentDate->toIso8601String();
      }

      switch ($publication->recurrence_type) {
        case 'daily':
          $currentDate->addDays($interval);
          break;
        case 'weekly':
          if (!empty($publication->recurrence_days)) {
            $currentDay = $currentDate->dayOfWeek;
            $nextDay = null;

            $sortedDays = $publication->recurrence_days;
            sort($sortedDays);

            foreach ($sortedDays as $day) {
              if ($day > $currentDay) {
                $nextDay = $day;
                break;
              }
            }

            if ($nextDay !== null) {
              $currentDate->addDays($nextDay - $currentDay);
            } else {
              $nextDay = $sortedDays[0];
              $currentDate->subDays($currentDay)->addWeeks($interval)->addDays($nextDay);
            }
          } else {
            $currentDate->addWeeks($interval);
          }
          break;
        case 'monthly':
          $currentDate->addMonths($interval);
          break;
        case 'yearly':
          $currentDate->addYears($interval);
          break;
      }
      $count++;
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
