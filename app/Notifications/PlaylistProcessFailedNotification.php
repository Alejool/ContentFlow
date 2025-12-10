<?php

namespace App\Notifications;

use App\Channels\ExtendedDatabaseChannel;
use App\Models\YouTubePlaylistQueue;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PlaylistProcessFailedNotification extends Notification implements ShouldQueue
{
  use Queueable;

  protected $queueItem;
  protected $playlistName;
  protected $errorMessage;
  protected $videoTitle;

  public function __construct(YouTubePlaylistQueue $queueItem, string $errorMessage, string $videoTitle = null)
  {
    $this->queueItem = $queueItem;
    $this->playlistName = $queueItem->playlist_name;
    $this->errorMessage = $errorMessage;
    $this->videoTitle = $videoTitle;
  }

  public function via(object $notifiable): array
  {
    $channels = [ExtendedDatabaseChannel::class];

    // Only broadcast if using redis or reverb
    if (in_array(config('broadcasting.default'), ['redis', 'reverb'])) {
      $channels[] = 'broadcast';
    }

    return $channels;
  }

  public function toDatabase(object $notifiable): array
  {
    $videoInfo = $this->videoTitle ? "'{$this->videoTitle}'" : "Video";
    $retryInfo = $this->queueItem->retry_count >= 3
      ? " Maximum retries reached."
      : " Will retry automatically.";

    $message = "{$videoInfo} failed to be added to playlist '{$this->playlistName}'.{$retryInfo}";

    return [
      'type' => 'playlist_process_failed',
      'category' => 'system',
      'status' => 'error',
      'message' => $message,
      'error_message' => $this->errorMessage,
      'playlist_name' => $this->playlistName,
      'video_id' => $this->queueItem->video_id,
      'campaign_id' => $this->queueItem->campaign_id,
      'retry_count' => $this->queueItem->retry_count,
      'max_retries_reached' => $this->queueItem->retry_count >= 3,
    ];
  }

  public function toBroadcast(object $notifiable): array
  {
    return $this->toDatabase($notifiable);
  }
}
