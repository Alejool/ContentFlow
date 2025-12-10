<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class APIQuotaWarningNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_HIGH;
  protected string $category = self::CATEGORY_SYSTEM;

  public function __construct(
    protected string $platformName,
    protected int $percentageUsed,
    protected ?string $resetDate = null
  ) {
    $this->platform = strtolower($platformName);
  }

  public function toArray($notifiable): array
  {
    $message = "API quota for {$this->getPlatformName($this->platform)} is at {$this->percentageUsed}%";

    if ($this->resetDate) {
      $message .= ". Resets on {$this->resetDate}";
    }

    return [
      'title' => 'API Quota Warning',
      'message' => $message,
      'description' => 'Consider reducing API usage to avoid service interruption',
      'status' => 'warning',
      'icon' => $this->getPlatformIcon($this->platform),
      'percentage_used' => $this->percentageUsed,
      'reset_date' => $this->resetDate,
    ];
  }
}
