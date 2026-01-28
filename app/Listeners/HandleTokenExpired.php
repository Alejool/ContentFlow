<?php
namespace App\Listeners;

use App\Events\TokenExpired;
use App\Notifications\TokenExpiredNotification;
use App\Events\AccountReconnectionNeeded;

class HandleTokenExpired
{
  public function handle(TokenExpired $event)
  {
    // Enviar email al usuario
    $event->account->user->notify(new TokenExpiredNotification($event->account));

    // Enviar notificación en tiempo real
    broadcast(new AccountReconnectionNeeded($event->account));
  }
}
