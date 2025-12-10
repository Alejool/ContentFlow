<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class SystemErrorNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_CRITICAL;
  protected string $category = self::CATEGORY_SYSTEM;

  public function __construct(
    protected string $errorTitle,
    protected string $errorMessage,
    protected ?array $context = null
  ) {}

  public function toArray($notifiable): array
  {
    return [
      'title' => $this->errorTitle,
      'message' => $this->errorMessage,
      'description' => 'A critical system error has occurred',
      'status' => 'error',
      'icon' => 'AlertTriangle',
      'context' => $this->context,
      'action' => $this->createAction(
        'View Details',
        route('dashboard')
      ),
    ];
  }
}
