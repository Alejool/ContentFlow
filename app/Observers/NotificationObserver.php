<?php

namespace App\Observers;

use App\Events\NotificationCreated;
use Illuminate\Notifications\DatabaseNotification;

class NotificationObserver
{
  /**
   * Handle the DatabaseNotification "created" event.
   */
  public function created(DatabaseNotification $notification): void
  {
    // Access the notifiable (User) to get the ID
    // Assuming notifiable_type maps to User model
    if ($notification->notifiable_id) {
      event(new NotificationCreated((int) $notification->notifiable_id));
    }
  }
}
