<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Channels\ExtendedDatabaseChannel;

class WorkspaceRemovedNotification extends BaseNotification
{
  /**
   * Create a new notification instance.
   */
  public function __construct(public string $workspaceName) {}

  /**
   * Get the notification's delivery channels.
   */
  public function via($notifiable): array
  {
    return [ExtendedDatabaseChannel::class, 'broadcast'];
  }

  /**
   * Get the array representation of the notification.
   */
  public function toArray($notifiable): array
  {
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

    return [
      'type' => 'workspace_removed',
      'title' => trans('notifications.workspace_removed', [], $locale),
      'message' => trans('notifications.workspace_removed_description', ['workspace_name' => $this->workspaceName], $locale),
      'workspace_name' => $this->workspaceName,
      'category' => self::CATEGORY_SYSTEM,
      'priority' => self::PRIORITY_HIGH,
    ];
  }

  /**
   * Get the category of the notification.
   */
  public function getCategory(): string
  {
    return self::CATEGORY_SYSTEM;
  }
}
