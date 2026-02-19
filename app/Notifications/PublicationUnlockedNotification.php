<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class PublicationUnlockedNotification extends BaseNotification
{
    protected string $priority = self::PRIORITY_NORMAL;
    protected string $category = self::CATEGORY_APPLICATION;

    public function __construct(
        protected $publication,
        protected $unlockedBy
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

        return [
            'title' => trans('notifications.unlocked.title', [], $locale),
            'message' => trans('notifications.unlocked.message', ['title' => $this->publication->title], $locale),
            'description' => trans('notifications.unlocked.description', ['user' => $this->unlockedBy->name], $locale),
            'status' => 'info',
            'icon' => 'Unlock',
            'publication_id' => $this->publication->id,
            'publication_title' => $this->publication->title,
            'unlocked_by' => $this->unlockedBy->name,
            'action' => $this->createAction(
                trans('notifications.unlocked.action', [], $locale),
                route('api.v1.publications.show', $this->publication->id)
            ),
        ];
    }
}
