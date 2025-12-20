<?php

namespace App\Services\Scheduling;

use App\Models\Publications\Publication;
use App\Models\ScheduledPost;
use App\Models\SocialAccount;
use Illuminate\Support\Facades\Auth;

class SchedulingService
{
  public function scheduleForAccounts(Publication $publication, array $accountIds, array $accountSchedules = []): void
  {
    $baseSchedule = $publication->scheduled_at;
    $socialAccounts = SocialAccount::whereIn('id', $accountIds)->get()->keyBy('id');

    foreach ($accountIds as $accountId) {
      $scheduledAt = $accountSchedules[$accountId] ?? $baseSchedule;

      if (!$scheduledAt) {
        continue;
      }

      $socialAccount = $socialAccounts[$accountId] ?? null;

      ScheduledPost::updateOrCreate(
        [
          'publication_id' => $publication->id,
          'social_account_id' => $accountId,
          'status' => 'pending',
        ],
        [
          'user_id' => Auth::id(),
          'scheduled_at' => $scheduledAt,
          'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
          'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
        ]
      );
    }

    // Cleanup: Remove accounts that are no longer selected but are still in pending status
    ScheduledPost::where('publication_id', $publication->id)
      ->where('status', 'pending')
      ->whereNotIn('social_account_id', $accountIds)
      ->delete();
  }

  public function syncSchedules(Publication $publication, array $accountIds, array $accountSchedules = []): void
  {
    $this->scheduleForAccounts($publication, $accountIds, $accountSchedules);

    // Auto-revert to draft if no pending schedules and no global date
    $hasPending = $publication->scheduled_posts()->where('status', 'pending')->exists();
    if (!$hasPending && empty($publication->scheduled_at)) {
      $publication->update(['status' => 'draft']);
    }
  }
}
