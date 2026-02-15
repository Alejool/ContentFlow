<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;
use Illuminate\Notifications\Messages\MailMessage;

class PublicationApprovedNotification extends BaseNotification
{
    protected string $priority = self::PRIORITY_NORMAL;
    protected string $category = self::CATEGORY_APPLICATION;

    public function __construct(
        protected $publication,
        protected $approver
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail($notifiable)
    {
        $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

        return (new MailMessage)
            ->subject(trans('notifications.approved.subject', [], $locale))
            ->view('emails.notification', [
                'title' => trans('notifications.approved.title', [], $locale),
                'level' => 'success',
                'introLines' => [
                    trans('notifications.approved.intro', [
                        'title' => $this->publication->title,
                        'approver' => $this->approver->name
                    ], $locale)
                ],
                'actionText' => trans('notifications.approved.action', [], $locale),
                'actionUrl' => route('api.v1.publications.show', $this->publication->id),
                'outroLines' => [
                    trans('notifications.approved.outro', [], $locale)
                ]
            ]);
    }

    public function toArray($notifiable): array
    {
        $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

        return [
            'title' => trans('notifications.approved.title', [], $locale),
            'message' => trans('notifications.approved.message_app', ['title' => $this->publication->title], $locale),
            'description' => trans('notifications.approved.description_app', ['approver' => $this->approver->name], $locale),
            'status' => 'success',
            'icon' => 'CheckCircle',
            'publication_id' => $this->publication->id,
            'publication_title' => $this->publication->title,
            'action' => $this->createAction(
                trans('notifications.approved.action', [], $locale),
                route('api.v1.publications.show', $this->publication->id)
            ),
        ];
    }
}
