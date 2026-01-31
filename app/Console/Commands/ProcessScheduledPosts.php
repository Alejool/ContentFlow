<?php

namespace App\Console\Commands;

use App\Models\Social\SocialPostLog;
use App\Jobs\PublishSocialPostJob;
use Illuminate\Console\Command;

class ProcessScheduledPosts extends Command
{
  protected $signature = 'social:process-scheduled';

  public function handle()
  {
    $posts = SocialPostLog::where('status', 'scheduled')
      ->where('scheduled_for', '<=', now())
      ->get();

    foreach ($posts as $post) {
      PublishSocialPostJob::dispatch($post);
      $post->update(['status' => 'queued']);
    }

    $this->info("{$posts->count()} posts programados procesados.");
  }
}
