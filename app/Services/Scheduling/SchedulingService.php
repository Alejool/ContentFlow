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
}
