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
    $socialAccounts = SocialAccount::whereIn('id', $accountIds)->get()->keyBy('id');

    foreach ($accountIds as $accountId) {
      // Prioritize account-specific schedule over global schedule
      $scheduledAt = isset($accountSchedules[$accountId]) ? $accountSchedules[$accountId] : $baseSchedule;

      if (!$scheduledAt) {
        continue;
      }

      $socialAccount = $socialAccounts[$accountId] ?? null;

      // Use separate find and update/create to ensure scheduled_at is always updated
      $existingPost = ScheduledPost::where('publication_id', $publication->id)
        ->where('social_account_id', $accountId)
        ->where('status', 'pending')
        ->first();

      if ($existingPost) {
        $existingPost->update([
          'scheduled_at' => $scheduledAt,
          'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
          'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
        ]);
      } else {
        ScheduledPost::create([
          'publication_id' => $publication->id,
          'social_account_id' => $accountId,
          'status' => 'pending',
          'user_id' => Auth::id(),
          'workspace_id' => Auth::user()->current_workspace_id,
          'scheduled_at' => $scheduledAt,
          'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
          'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
        ]);
      }
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
      if ($publication->status !== 'draft') {
        $publication->update(['status' => 'draft']);
      }
    } elseif (($hasPending || !empty($publication->scheduled_at)) && $publication->status === 'draft') {
      // If it has schedules and it's currently a draft, mark it as scheduled
      $publication->logActivity('scheduled');
      $publication->update(['status' => 'scheduled']);
    }
  }
}
