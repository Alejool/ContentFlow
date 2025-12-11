<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;
use App\Channels\EnhancedDatabaseChannel;

class TestNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_HIGH;
  protected string $category = self::CATEGORY_SYSTEM;

  public function via($notifiable): array
  {
    return ['broadcast', EnhancedDatabaseChannel::class];
  }

  public function toArray($notifiable): array
  {
    return [
      'title' => 'Reverb Test 🚀',
      'message' => 'Si ves esto, Reverb está funcionando correctamente.',
      'description' => 'Esta es una prueba de tiempo real.',
      'status' => 'success',
      'icon' => 'CheckCircle',
      'timestamp' => now()->toIso8601String(),
    ];
  }
}
