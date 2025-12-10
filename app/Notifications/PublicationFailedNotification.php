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
    return [
      'title' => 'Publication Failed',
      'message' => "Failed to publish to {$this->getPlatformName($this->platform)}",
      'description' => $this->errorMessage,
      'status' => 'error',
      'icon' => $this->getPlatformIcon($this->platform),
      'publication_id' => $this->publication->id,
      'publication_title' => $this->publication->title,
      'error' => $this->errorMessage,
      'action' => $this->createAction(
        'Retry',
        route('publications.edit', $this->publication->id)
      ),
    ];
  }
}
