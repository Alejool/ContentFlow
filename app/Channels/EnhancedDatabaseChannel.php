<?php

namespace App\Channels;

use Illuminate\Notifications\Channels\DatabaseChannel;
use Illuminate\Notifications\Notification;
use App\Models\User;

class EnhancedDatabaseChannel extends DatabaseChannel
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
    $data = $this->getData($notifiable, $notification);

    return $notifiable->routeNotificationFor('database')->create([
      'id' => $notification->id,
      'type' => get_class($notification),
      'data' => $data,
      'read_at' => null,
      'user_id' => $notifiable instanceof User ? $notifiable->id : null,
      'category' => method_exists($notification, 'getCategory') ? $notification->getCategory() : 'application',
      'publication_id' => isset($data['publication_id']) ? $data['publication_id'] : null,
      'social_post_log_id' => isset($data['social_post_log_id']) ? $data['social_post_log_id'] : null,
    ]);
  }
}
