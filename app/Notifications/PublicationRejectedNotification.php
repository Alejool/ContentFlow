<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;
use Illuminate\Notifications\Messages\MailMessage;

class PublicationRejectedNotification extends BaseNotification
{
    protected string $priority = self::PRIORITY_HIGH;
    protected string $category = self::CATEGORY_APPLICATION;

    public function __construct(
        protected $publication,
        protected $rejector
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail($notifiable)
    {
        $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

        return (new MailMessage)
            ->subject(trans('notifications.rejected.subject', [], $locale))
            ->view('emails.notification', [
                'title' => trans('notifications.rejected.title', [], $locale),
                'level' => 'error',
                'introLines' => [
                    trans('notifications.rejected.intro', [
                        'title' => $this->publication->title,
                        'rejector' => $this->rejector->name
                    ], $locale),
                    "<strong>" . trans('notifications.rejected.reason_label', [], $locale) . "</strong> {$this->publication->rejection_reason}"
                ],
                'actionText' => trans('notifications.rejected.action', [], $locale),
                'actionUrl' => route('content.index', ['tab' => 'publications', 'id' => $this->publication->id]),
                'outroLines' => [
                    trans('notifications.rejected.outro', [], $locale)
                ]
            ]);
    }

    public function toArray($notifiable): array
    {
        $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

        return [
            'title' => trans('notifications.rejected.title', [], $locale),
            'message' => trans('notifications.rejected.message_app', ['title' => $this->publication->title], $locale),
            'description' => trans('notifications.rejected.description_app', ['rejector' => $this->rejector->name], $locale),
            'status' => 'error',
            'icon' => 'XCircle',
            'publication_id' => $this->publication->id,
            'publication_title' => $this->publication->title,
            'rejection_reason' => $this->publication->rejection_reason,
            'rejected_by' => $this->rejector->name,
            'rejected_at' => $this->publication->rejected_at,
            'action' => $this->createAction(
                trans('notifications.rejected.action', [], $locale),
                route('content.index', ['tab' => 'publications', 'id' => $this->publication->id])
            ),
        ];
    }
}
