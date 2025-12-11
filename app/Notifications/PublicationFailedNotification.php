<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class PublicationFailedNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_HIGH;
  protected string $category = self::CATEGORY_APPLICATION;

  public function __construct(
    protected $publication,
    protected string $platformName,
    protected string $errorMessage
  ) {
    $this->platform = strtolower($platformName);
  }

  public function toArray($notifiable): array
  {
    $platformName = $this->getPlatformName($this->platform);
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();
    $campaign = $this->publication->campaigns->first();

    return [
      'title' => 'Publication Failed',
      'message' => trans('notifications.publication_failed', ['platform' => $platformName], $locale),
      'description' => $this->errorMessage,
      'status' => 'error',
      'icon' => $this->getPlatformIcon($this->platform),
      'publication_id' => $this->publication->id,
      'publication_title' => $this->publication->title,
      'campaign_id' => $campaign ? $campaign->id : null,
      'campaign_name' => $campaign ? $campaign->name : null,
      'error' => $this->errorMessage,
      'action' => $this->createAction(
        'Retry',
        route('publications.edit', $this->publication->id)
      ),
    ];
  }
}
