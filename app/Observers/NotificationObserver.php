<?php

namespace App\Observers;

use App\Events\NotificationCreated;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Log;

class NotificationObserver
{
  /**
   * Handle the DatabaseNotification "created" event.
   */
  public function created(DatabaseNotification $notification): void
  {
    Log::info('NotificationObserver: created fired', ['id' => $notification->id]);

    // Access the notifiable (User) to get the ID
    // Assuming notifiable_type maps to User model
    if ($notification->notifiable_id) {
      Log::info('NotificationObserver: dispatching event for user', ['user_id' => $notification->notifiable_id]);
      event(new NotificationCreated((int) $notification->notifiable_id));
    } else {
      Log::warning('NotificationObserver: no notifiable_id found');
    }
  }
}
