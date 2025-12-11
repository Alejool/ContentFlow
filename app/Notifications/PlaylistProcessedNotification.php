<?php

namespace App\Notifications;

use App\Channels\ExtendedDatabaseChannel;
use App\Models\YouTubePlaylistQueue;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PlaylistProcessedNotification extends Notification implements ShouldQueue
{
  use Queueable;

  protected $queueItem;
  protected $playlistName;
  protected $videoTitle;

  public function __construct(YouTubePlaylistQueue $queueItem, string $videoTitle = null)
  {
    $this->queueItem = $queueItem;
    $this->playlistName = $queueItem->playlist_name;
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
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();
    $message = trans('notifications.playlist_processed', ['platform' => 'YouTube'], $locale);

    return [
      'type' => 'playlist_processed',
      'category' => 'system',
      'status' => 'success',
      'message' => $message,
      'description' => $this->videoTitle
        ? "Video '{$this->videoTitle}' added to playlist '{$this->playlistName}'"
        : "Added to playlist '{$this->playlistName}'",
      'playlist_name' => $this->playlistName,
      'playlist_id' => $this->queueItem->playlist_id,
      'video_id' => $this->queueItem->video_id,
      'video_title' => $this->videoTitle,
      'campaign_id' => $this->queueItem->campaign_id,
    ];
  }

  public function toBroadcast(object $notifiable): array
  {
    return $this->toDatabase($notifiable);
  }
}
