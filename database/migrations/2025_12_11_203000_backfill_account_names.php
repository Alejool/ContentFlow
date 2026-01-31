<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Social\ScheduledPost;
use App\Models\Social\SocialPostLog;
use App\Models\Social\SocialAccount;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    // Backfill ScheduledPosts
    $scheduledPosts = ScheduledPost::whereNull('account_name')->with(['socialAccount' => function ($q) {
      $q->withTrashed();
    }])->get();

    foreach ($scheduledPosts as $post) {
      if ($post->socialAccount) {
        $post->update([
          'account_name' => $post->socialAccount->account_name,
          'platform' => $post->socialAccount->platform,
        ]);
      }
    }

    // Backfill SocialPostLogs
    $logs = SocialPostLog::whereNull('account_name')->with(['socialAccount' => function ($q) {
      $q->withTrashed();
    }])->get();

    foreach ($logs as $log) {
      if ($log->socialAccount) {
        // platform is usually already in log, but ensuring account_name
        $log->update([
          'account_name' => $log->socialAccount->account_name,
        ]);
      }
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    // No reverse needed for data backfill
  }
};
