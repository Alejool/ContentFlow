<?php

namespace App\Channels;

use Illuminate\Notifications\Channels\DatabaseChannel;
use Illuminate\Notifications\Notification;

class ExtendedDatabaseChannel extends DatabaseChannel
{
  /**
   * Send the given notification.
   *
   * @param  mixed  $notifiable
   * @param  \Illuminate\Notifications\Notification  $notification
   * @return \Illuminate\Database\Eloquent\Model
   */
  public function send($notifiable, Notification $notification)
  {
    return $notifiable->routeNotificationFor('database')->create([
      'id' => $notification->id,
      'type' => get_class($notification),
      'data' => $this->getData($notifiable, $notification),
      'read_at' => null,
      'user_id' => $notifiable->id,
      'category' => method_exists($notification, 'getCategory') ? $notification->getCategory() : 'system',
      'publication_id' => method_exists($notification, 'getPublicationId') ? $notification->getPublicationId() : null,
      'social_post_log_id' => method_exists($notification, 'getSocialPostLogId') ? $notification->getSocialPostLogId() : null,
    ]);
  }
}
