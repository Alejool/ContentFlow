<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class SocialAccountConnectedNotification extends BaseNotification
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
      'title' => 'Account Connected',
      'message' => "{$this->getPlatformName($this->platform)} account connected successfully",
      'status' => 'success',
      'icon' => $this->getPlatformIcon($this->platform),
      'action' => $this->createAction(
        'Manage Accounts',
        route('social-accounts.index')
      ),
    ];
  }
}
