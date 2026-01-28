<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class APIQuotaWarningNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_HIGH;
  protected string $category = self::CATEGORY_APPLICATION;

  public function __construct(
    protected string $platformName,
    protected int $percentageUsed,
    protected ?string $resetDate = null
  ) {
    $this->platform = strtolower($platformName);
  }

  public function toArray($notifiable): array
  {
    $platformName = $this->getPlatformName($this->platform);
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();
    $message = trans('notifications.api_quota_warning', ['platform' => $platformName], $locale) . " ({$this->percentageUsed}%)";

    if ($this->resetDate) {
      $message .= ". Resets on {$this->resetDate}";
    }

    return [
      'title' => 'API Quota Warning',
      'message' => $message,
      'description' => trans('notifications.api_quota_description', [], $locale),
      'status' => 'warning',
      'icon' => $this->getPlatformIcon($this->platform),
      'percentage_used' => $this->percentageUsed,
      'reset_date' => $this->resetDate,
    ];
  }
}
