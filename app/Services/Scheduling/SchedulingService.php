<?php

namespace App\Services\Scheduling;

use App\Models\Publications\Publication;
use App\Models\Social\ScheduledPost;
use App\Models\Social\SocialAccount;
use Illuminate\Support\Facades\Auth;

class SchedulingService
{
  public function scheduleForAccounts(Publication $publication, array $accountIds, array $accountSchedules = []): void
  {
    $baseSchedule = $publication->scheduled_at;

    // Generate dates if recurring
    $dates = [$baseSchedule];
    if ($publication->is_recurring && $baseSchedule) {
      $dates = $this->calculateRecurrenceDates($publication);
    }
    $socialAccounts = SocialAccount::whereIn('id', $accountIds)->get()->keyBy('id');

    foreach ($accountIds as $accountId) {
      $socialAccount = $socialAccounts[$accountId] ?? null;

      // If specific account schedule is provided in $accountSchedules, it overrides everything for that account?
      // Actually, $accountSchedules IS used in the frontend for custom per-account timing.
      // But if it's recurring, we probably want to apply the recurrence to all.

      $accountBaseSchedule = isset($accountSchedules[$accountId]) ? $accountSchedules[$accountId] : $baseSchedule;

      // If it's recurring, we use the calculated $dates.
      // If it's NOT recurring, we use the single $accountBaseSchedule.
      $specificDates = ($publication->is_recurring && !$publication->social_account_schedules) ? $dates : [$accountBaseSchedule];

      foreach ($specificDates as $scheduledAt) {
        if (!$scheduledAt) {
          continue;
        }

        // Use separate find and update/create to ensure scheduled_at is always updated
        // For recurring, we should probably check if a post already exists for this date and account.
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

    // Cleanup: Remove accounts that are no longer selected
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
   * Calculate future dates for a recurring publication.
   */
  protected function calculateRecurrenceDates(Publication $publication): array
  {
    if (!$publication->scheduled_at) {
      return [];
    }

    $dates = [];
    $startDate = \Carbon\Carbon::parse($publication->scheduled_at);
    $endDate = $publication->recurrence_end_date ? \Carbon\Carbon::parse($publication->recurrence_end_date) : null;
    $interval = max(1, $publication->recurrence_interval ?? 1);

    // Default limit: 3 months if no end date
    if (!$endDate) {
      $endDate = now()->addMonths(3);
    }

    $currentDate = clone $startDate;

    // We limit to 50 occurrences to avoid memory/timeout issues
    $count = 0;
    while ($currentDate->lessThanOrEqualTo($endDate) && $count < 50) {
      $dates[] = $currentDate->toIso8601String();

      switch ($publication->recurrence_type) {
        case 'daily':
          $currentDate->addDays($interval);
          break;
        case 'weekly':
          if (!empty($publication->recurrence_days)) {
            // Complex weekly recursion (specific days)
            $foundNext = false;
            $originalDay = $currentDate->dayOfWeek;

            // Try remaining days this week
            for ($i = 1; $i <= 7; $i++) {
              $currentDate->addDay();
              if (in_array($currentDate->dayOfWeek, $publication->recurrence_days)) {
                // If it's the start of a new week cycle based on interval
                // This is a simplified version: handles daily within week, but interval applies to week jump.
                $foundNext = true;
                break;
              }
            }
            if (!$foundNext) {
              // Fallback if no days selected
              $currentDate->addWeeks($interval);
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
}
