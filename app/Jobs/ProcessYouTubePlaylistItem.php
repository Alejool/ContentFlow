<?php

namespace App\Jobs;

use App\Models\Youtube\YouTubePlaylistQueue;
use App\Services\SocialPlatforms\YouTubeService;
use App\Notifications\PlaylistProcessedNotification;
use App\Notifications\PlaylistProcessFailedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessYouTubePlaylistItem implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public $tries = 3;
  public $backoff = [60, 300, 900];

  public function __construct(
    protected YouTubePlaylistQueue $queueItem
  ) {}

  public function handle(): void
  {
    $item = $this->queueItem->fresh();
    
    if (!$item || $item->status === 'completed') {
      return;
    }

    try {
      $item->markAsProcessing();

      $socialPostLog = $item->socialPostLog;
      if (!$socialPostLog) {
        throw new \Exception('Social post log not found');
      }

      $socialAccount = $socialPostLog->socialAccount;
      if (!$socialAccount || $socialAccount->platform !== 'youtube') {
        throw new \Exception('YouTube social account not found');
      }

      $youtubeService = new YouTubeService($socialAccount->access_token, $socialAccount);

      $playlistId = $item->playlist_id;

      if (!$playlistId) {
        $playlistId = $youtubeService->findPlaylistByName($item->playlist_name);

        if (!$playlistId) {
          $campaign = $item->campaign;
          $description = $campaign ? ($campaign->description ?? $item->playlist_name) : $item->playlist_name;

          $playlistId = $youtubeService->createPlaylist(
            $item->playlist_name,
            $description,
            'public'
          );

          if (!$playlistId) {
            throw new \Exception("Failed to create playlist '{$item->playlist_name}'");
          }

          if ($campaign) {
            $campaign->youtube_playlist_id = $playlistId;
            $campaign->save();
          }
        }

        $item->playlist_id = $playlistId;
        $item->save();
      }

      try {
        $success = $youtubeService->addVideoToPlaylist($playlistId, $item->video_id);
      } catch (\Exception $e) {
        if (str_contains($e->getMessage(), '404') || stripos($e->getMessage(), 'not found') !== false) {
          $campaign = $item->campaign;
          $description = $campaign ? ($campaign->description ?? $item->playlist_name) : $item->playlist_name;

          $newPlaylistId = $youtubeService->createPlaylist(
            $item->playlist_name,
            $description,
            'public'
          );

          if ($newPlaylistId) {
            if ($campaign) {
              $campaign->youtube_playlist_id = $newPlaylistId;
              $campaign->save();
            }
            $item->playlist_id = $newPlaylistId;
            $item->save();

            $success = $youtubeService->addVideoToPlaylist($newPlaylistId, $item->video_id);
          } else {
            throw new \Exception("Failed to create playlist '{$item->playlist_name}' after 404 error.");
          }
        } else {
          throw $e;
        }
      }

      if (!$success) {
        throw new \Exception('Failed to add video to playlist');
      }

      $item->markAsCompleted();

      $videoTitle = $socialPostLog->publication?->title;
      $user = $socialPostLog->publication?->user;
      
      if ($user) {
        $user->notify(new PlaylistProcessedNotification($item, $videoTitle));
      }

      Log::info('Playlist operation completed', [
        'video_id' => $item->video_id,
        'playlist_id' => $item->playlist_id,
        'playlist_name' => $item->playlist_name
      ]);
    } catch (\Exception $e) {
      $item->markAsFailed($e->getMessage());

      $videoTitle = $socialPostLog?->publication?->title;
      $user = $socialPostLog?->publication?->user;

      // Only send notification on final failure (retry_count >= 3)
      if ($user && $item->retry_count >= 3) {
        $identifier = $socialAccount->account_name ?? 'Unknown';
        if (isset($socialAccount->account_metadata['email'])) {
          $identifier .= " ({$socialAccount->account_metadata['email']})";
        } elseif (isset($socialAccount->account_metadata['username'])) {
          $identifier .= " (@{$socialAccount->account_metadata['username']})";
        }

        $user->notify(new PlaylistProcessFailedNotification($item, $e->getMessage(), $videoTitle, $identifier));
      }

      Log::error('Playlist operation failed', [
        'video_id' => $item->video_id,
        'playlist_name' => $item->playlist_name,
        'error' => $e->getMessage(),
        'retry_count' => $item->retry_count
      ]);

      if ($item->retry_count < 3) {
        throw $e;
      }
    }
  }
}
