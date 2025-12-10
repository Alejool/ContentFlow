<?php

namespace App\Services;

use App\Notifications\BaseNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class NotificationService
{
  /**
   * Send a notification to a user or users
   */
  public static function send(
    $user,
    BaseNotification $notification,
    ?string $priority = null
  ): void {
    try {
      // Override priority if specified
      if ($priority) {
        $reflection = new \ReflectionClass($notification);
        $property = $reflection->getProperty('priority');
        $property->setAccessible(true);
        $property->setValue($notification, $priority);
      }

      // Send notification
      if (is_array($user) || $user instanceof \Illuminate\Support\Collection) {
        Notification::send($user, $notification);
      } else {
        $user->notify($notification);
      }

      Log::info('Notification sent', [
        'type' => get_class($notification),
        'priority' => $notification->getPriority(),
        'category' => $notification->getCategory(),
        'platform' => $notification->getPlatform(),
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to send notification', [
        'type' => get_class($notification),
        'error' => $e->getMessage(),
      ]);
    }
  }

  /**
   * Send a notification to multiple users
   */
  public static function sendToMany(
    $users,
    BaseNotification $notification
  ): void {
    self::send($users, $notification);
  }

  /**
   * Check if user should receive notification based on rate limiting
   */
  public static function shouldSendNotification(
    $user,
    string $notificationType,
    int $maxPerHour = 10
  ): bool {
    $count = $user->notifications()
      ->where('type', $notificationType)
      ->where('created_at', '>=', now()->subHour())
      ->count();

    return $count < $maxPerHour;
  }
}
