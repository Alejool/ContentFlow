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
    \Log::info("📋 SchedulingService::scheduleForAccounts called", [
      'publication_id' => $publication->id,
      'account_ids' => $accountIds,
      'account_schedules' => $accountSchedules
    ]);

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
        \Log::info("✏️ Updated existing scheduled post", ['id' => $existingPost->id]);
      } else {
        $created = ScheduledPost::create([
          'publication_id' => $publication->id,
          'social_account_id' => $accountId,
          'status' => 'pending',
          'user_id' => Auth::id(),
          'workspace_id' => Auth::user()->current_workspace_id,
          'scheduled_at' => $scheduledAt,
          'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
          'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
        ]);
        \Log::info("➕ Created new scheduled post", ['id' => $created->id]);
      }
    }

    // Cleanup: Remove accounts that are no longer selected
    // Only delete pending scheduled posts to avoid removing published/posted records
    if (empty($accountIds)) {
      // If no accounts selected, remove all pending schedules
      $deleted = ScheduledPost::where('publication_id', $publication->id)
        ->where('status', 'pending')
        ->delete();
      \Log::info("🗑️ Deleted ALL pending schedules", ['count' => $deleted]);
    } else {
      // Remove pending schedules for accounts that are no longer selected
      $deleted = ScheduledPost::where('publication_id', $publication->id)
        ->where('status', 'pending')
        ->whereNotIn('social_account_id', $accountIds)
        ->delete();
      \Log::info("🗑️ Deleted schedules not in list", ['count' => $deleted, 'kept_ids' => $accountIds]);
    }
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
