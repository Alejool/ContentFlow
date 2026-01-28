<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class SocialAccountConnectedNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_NORMAL;
  protected string $category = self::CATEGORY_APPLICATION;

  public function __construct(
    protected string $platformName,
    protected string $accountName,
    protected bool $wasReconnection = false
  ) {
    $this->platform = strtolower($platformName);
  }

  public function toArray($notifiable): array
  {
    $platformName = $this->getPlatformName($this->platform);
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

    $message = $this->wasReconnection
      ? trans('notifications.social_account_connected', ['platform' => $platformName], $locale)
      : trans('notifications.social_account_connected', ['platform' => $platformName], $locale);

    return [
      'title' => $this->wasReconnection ? 'Cuenta Reconectada' : 'Cuenta Conectada',
      'message' => $message,
      'description' => "Cuenta: {$this->accountName}",
      'status' => 'success',
      'icon' => $this->getPlatformIcon($this->platform),
      'account_name' => $this->accountName,
      'timestamp' => now()->toIso8601String(),
    ];
  }
}
