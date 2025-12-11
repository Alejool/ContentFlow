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
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

    return [
      'title' => 'Reverb Test 🚀',
      'message' => trans('notifications.test_notification', [], $locale),
      'description' => $locale === 'es' ? 'Esta es una prueba de tiempo real.' : 'This is a real-time test.',
      'status' => 'success',
      'icon' => 'CheckCircle',
      'timestamp' => now()->toIso8601String(),
    ];
  }
}
