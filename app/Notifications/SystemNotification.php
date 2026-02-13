<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class SystemNotification extends BaseNotification
{
  public function __construct(
    protected string $title,
    protected string $message,
    protected ?string $description = null,
    protected string $type = 'info',
    protected ?string $icon = 'Bell'
  ) {
    $this->priority = self::PRIORITY_NORMAL;
    $this->category = self::CATEGORY_SYSTEM;
  }

  public function toArray($notifiable): array
  {
    return [
      'title' => $this->title,
      'message' => $this->message,
      'description' => $this->description,
      'type' => $this->type,
      'icon' => $this->icon,
      'category' => 'system',
    ];
  }
}
