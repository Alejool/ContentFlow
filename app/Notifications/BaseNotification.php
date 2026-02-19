<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use App\Channels\EnhancedDatabaseChannel;
use App\Channels\CustomSlackChannel;
use App\Channels\CustomDiscordChannel;
use App\Models\Workspace\Workspace;

abstract class BaseNotification extends Notification implements ShouldQueue
{
  use Queueable;

  /**
   * Notification priority levels
   */
  const PRIORITY_LOW = 'low';
  const PRIORITY_NORMAL = 'normal';
  const PRIORITY_HIGH = 'high';
  const PRIORITY_CRITICAL = 'critical';

  /**
   * Notification categories
   */
  const CATEGORY_APPLICATION = 'application';
  const CATEGORY_SYSTEM = 'system';

  /**
   * Supported platforms
   */
  const PLATFORM_YOUTUBE = 'youtube';
  const PLATFORM_FACEBOOK = 'facebook';
  const PLATFORM_INSTAGRAM = 'instagram';
  const PLATFORM_TIKTOK = 'tiktok';
  const PLATFORM_TWITTER = 'twitter';
  const PLATFORM_LINKEDIN = 'linkedin';
  const PLATFORM_PINTEREST = 'pinterest';
  const PLATFORM_TELEGRAM = 'telegram';

  /**
   * The priority of this notification
   */
  protected string $priority = self::PRIORITY_NORMAL;

  /**
   * The category of this notification
   */
  protected string $category = self::CATEGORY_APPLICATION;

  /**
   * The platform this notification is related to (optional)
   */
  protected ?string $platform = null;

  /**
   * Get the notification's delivery channels.
   */
  public function via($notifiable): array
  {
    // Solo usar el canal de base de datos para alertas internas
    // No enviar notificaciones push ni broadcast
    $channels = [EnhancedDatabaseChannel::class];

    $workspace = null;

    if ($notifiable instanceof Workspace) {
      $workspace = $notifiable;
    } elseif (isset($notifiable->current_workspace_id)) {
      $workspace = $notifiable->currentWorkspace;
    }

    if ($workspace) {
      if ($workspace->slack_webhook_url) {
        $channels[] = CustomSlackChannel::class;
      }
      if ($workspace->discord_webhook_url) {
        $channels[] = CustomDiscordChannel::class;
      }
    }

    return $channels;
  }


  /**
   * Get the array representation of the notification.
   */
  abstract public function toArray($notifiable): array;

  /**
   * Get the broadcastable representation of the notification.
   */
  public function toBroadcast($notifiable): BroadcastMessage
  {
    $data = $this->toArray($notifiable);

    // Add metadata
    $data['id'] = $this->id;
    $data['priority'] = $this->priority;
    $data['category'] = $this->category;

    if ($this->platform) {
      $data['platform'] = $this->platform;
    }

    return new BroadcastMessage($data);
  }

  /**
   * Get the database representation of the notification.
   */
  public function toDatabase($notifiable): array
  {
    $data = $this->toArray($notifiable);

    // Add metadata
    $data['priority'] = $this->priority;
    $data['category'] = $this->category;

    if ($this->platform) {
      $data['platform'] = $this->platform;
    }

    return $data;
  }

  /**
   * Get the priority of this notification
   */
  public function getPriority(): string
  {
    return $this->priority;
  }

  /**
   * Get the category of this notification
   */
  public function getCategory(): string
  {
    return $this->category;
  }

  /**
   * Get the platform of this notification
   */
  public function getPlatform(): ?string
  {
    return $this->platform;
  }

  /**
   * Helper method to create action data
   */
  protected function createAction(string $label, string $url): array
  {
    return [
      'label' => $label,
      'url' => $url,
    ];
  }

  /**
   * Helper method to get platform icon
   */
  protected function getPlatformIcon(string $platform): string
  {
    return match ($platform) {
      self::PLATFORM_YOUTUBE => 'Youtube',
      self::PLATFORM_FACEBOOK => 'Facebook',
      self::PLATFORM_INSTAGRAM => 'Instagram',
      self::PLATFORM_TIKTOK => 'Music',
      self::PLATFORM_TWITTER => 'Twitter',
      self::PLATFORM_LINKEDIN => 'Linkedin',
      self::PLATFORM_PINTEREST => 'Pin',
      self::PLATFORM_TELEGRAM => 'Send',
      default => 'Bell',
    };
  }

  /**
   * Helper method to get platform display name
   */
  protected function getPlatformName(string $platform): string
  {
    return match ($platform) {
      self::PLATFORM_YOUTUBE => 'YouTube',
      self::PLATFORM_FACEBOOK => 'Facebook',
      self::PLATFORM_INSTAGRAM => 'Instagram',
      self::PLATFORM_TIKTOK => 'TikTok',
      self::PLATFORM_TWITTER => 'Twitter/X',
      self::PLATFORM_LINKEDIN => 'LinkedIn',
      self::PLATFORM_PINTEREST => 'Pinterest',
      self::PLATFORM_TELEGRAM => 'Telegram',
      default => ucfirst($platform),
    };
  }
}
