<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;
use App\Models\YouTubePlaylistQueue;

class PlaylistProcessFailedNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_HIGH;
  protected string $category = self::CATEGORY_APPLICATION;

  protected $queueItem;
  protected $playlistName;
  protected $errorMessage;
  protected $videoTitle;
  protected $accountIdentifier;

  public function __construct(YouTubePlaylistQueue $queueItem, string $errorMessage, string $videoTitle = null, string $accountIdentifier = 'Unknown')
  {
    $this->queueItem = $queueItem;
    $this->playlistName = $queueItem->playlist_name;
    $this->errorMessage = $errorMessage;
    $this->videoTitle = $videoTitle;
    $this->accountIdentifier = $accountIdentifier;
  }

  public function toArray($notifiable): array
  {
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();
    $message = trans('notifications.playlist_failed', ['platform' => 'YouTube'], $locale);

    $videoInfo = $this->videoTitle ?? "Video";
    $description = trans('notifications.playlist_failed_description', [
      'video_title' => $videoInfo,
      'playlist_name' => $this->playlistName,
      'account' => $this->accountIdentifier
    ], $locale);

    if ($this->queueItem->retry_count >= 3) {
      $description .= " " . trans('notifications.retry_max_reached', [], $locale);
    } else {
      $description .= " " . trans('notifications.retry_auto', [], $locale);
    }

    return [
      'title' => 'Playlist Update Failed',
      'message' => $message,
      'description' => $description,
      'status' => 'error',
      'icon' => 'Youtube',
      'account_identifier' => $this->accountIdentifier,
      'error_message' => $this->errorMessage,
      'playlist_name' => $this->playlistName,
      'video_id' => $this->queueItem->video_id,
      'video_title' => $this->videoTitle,
      'campaign_id' => $this->queueItem->campaign_id,
      'retry_count' => $this->queueItem->retry_count,
      'max_retries_reached' => $this->queueItem->retry_count >= 3,
    ];
  }
}
