<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class SystemErrorNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_CRITICAL;
  protected string $category = self::CATEGORY_APPLICATION;

  public function __construct(
    protected string $errorTitle,
    protected string $errorMessage,
    protected ?array $context = null
  ) {}

  public function toArray($notifiable): array
  {
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();
    return [
      'title' => $this->errorTitle,
      'message' => $this->errorMessage,
      'description' => trans('notifications.system_error_description', [], $locale),
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
