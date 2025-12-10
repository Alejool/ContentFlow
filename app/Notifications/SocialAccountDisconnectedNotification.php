<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class SocialAccountDisconnectedNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_NORMAL;
  protected string $category = self::CATEGORY_APPLICATION;

  public function __construct(
    protected string $platformName
  ) {
    $this->platform = strtolower($platformName);
  }

  public function toArray($notifiable): array
  {
    return [
      'title' => 'Account Disconnected',
      'message' => "{$this->getPlatformName($this->platform)} account has been disconnected",
      'status' => 'info',
      'icon' => $this->getPlatformIcon($this->platform),
    ];
  }
}
