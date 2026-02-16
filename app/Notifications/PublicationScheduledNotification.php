<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;
use App\Models\Publications\Publication;

class PublicationScheduledNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_NORMAL;
  protected string $category = self::CATEGORY_APPLICATION;

  public function __construct(
    protected Publication $publication,
    protected \DateTime $scheduledTime
  ) {}

  public function via($notifiable): array
  {
    return ['database', 'broadcast'];
  }

  public function toArray($notifiable): array
  {
    $locale = method_exists($notifiable, 'preferredLocale') 
      ? $notifiable->preferredLocale() 
      : app()->getLocale();

    return [
      'title' => trans('notifications.scheduled.title', [], $locale),
      'message' => trans('notifications.scheduled.message', [
        'title' => $this->publication->title,
        'time' => $this->scheduledTime->format('Y-m-d H:i')
      ], $locale),
      'status' => 'info',
      'icon' => 'Clock',
      'publication_id' => $this->publication->id,
      'publication_title' => $this->publication->title,
      'scheduled_at' => $this->scheduledTime->toIso8601String(),
      'action' => $this->createAction(
        trans('notifications.scheduled.action', [], $locale),
        route('api.v1.publications.show', $this->publication->id)
      ),
    ];
  }
}
