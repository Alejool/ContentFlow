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
      'user_id' => $notifiable->id, // Assuming notifiable is User
      'category' => method_exists($notification, 'getCategory') ? $notification->getCategory() : 'system',
    ]);
  }
}
