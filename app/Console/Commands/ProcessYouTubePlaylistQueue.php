<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Youtube\YouTubePlaylistQueue;
use App\Jobs\ProcessYouTubePlaylistItem;

class ProcessYouTubePlaylistQueue extends Command
{
  protected $signature = 'youtube:process-playlist-queue';
  protected $description = 'Process pending YouTube playlist operations';

  public function handle()
  {
    $this->info('Processing YouTube playlist queue...');

    $pendingItems = YouTubePlaylistQueue::where('status', 'pending')
      ->orWhere(function ($q) {
        $q->where('status', 'failed')
          ->where('retry_count', '<', 3)
          ->where('last_attempt_at', '<', now()->subMinutes(30));
      })
      ->orderBy('created_at', 'asc')
      ->limit(50)
      ->get();

    if ($pendingItems->isEmpty()) {
      $this->info('No pending playlist operations found.');
      return 0;
    }

    $this->info("Found {$pendingItems->count()} items to process. Dispatching jobs...");

    foreach ($pendingItems as $item) {
      ProcessYouTubePlaylistItem::dispatch($item);
    }

    $this->info("Dispatched {$pendingItems->count()} jobs to queue.");

    return 0;
  }
}
