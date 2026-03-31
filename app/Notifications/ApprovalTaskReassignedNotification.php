<?php

namespace App\Notifications;

use App\Models\Publications\Publication;
use App\Models\User;
use App\Notifications\BaseNotification;
use Illuminate\Notifications\Messages\MailMessage;

class ApprovalTaskReassignedNotification extends BaseNotification
{
    protected string $priority = self::PRIORITY_NORMAL;
    protected string $category = self::CATEGORY_APPLICATION;

    public function __construct(
        protected Publication $content,
        protected ?User $fromUser,
        protected string $reason,
        protected int $approvalLevel
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail($notifiable)
    {
        $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

        return (new MailMessage)
            ->subject(trans('notifications.task_reassigned.subject', [], $locale))
            ->view('emails.notification', [
                'title' => trans('notifications.task_reassigned.title', [], $locale),
                'level' => 'info',
                'introLines' => [
                    trans('notifications.task_reassigned.intro', [
                        'title' => $this->content->title,
                        'level' => $this->approvalLevel,
                        'reason' => $this->reason
                    ], $locale)
                ],
                'actionText' => trans('notifications.task_reassigned.action', [], $locale),
                'actionUrl' => route('api.v1.publications.show', $this->content->id),
                'outroLines' => [
                    trans('notifications.task_reassigned.outro', [], $locale)
                ]
            ]);
    }

    public function toArray($notifiable): array
    {
        $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

        return [
            'title' => trans('notifications.task_reassigned.title', [], $locale),
            'message' => trans('notifications.task_reassigned.message_app', [
                'title' => $this->content->title
            ], $locale),
            'description' => trans('notifications.task_reassigned.description_app', [
                'reason' => $this->reason,
                'level' => $this->approvalLevel
            ], $locale),
            'status' => 'info',
            'icon' => 'UserCheck',
            'publication_id' => $this->content->id,
            'publication_title' => $this->content->title,
            'from_user' => $this->fromUser?->name,
            'reason' => $this->reason,
            'approval_level' => $this->approvalLevel,
            'action' => $this->createAction(
                trans('notifications.task_reassigned.action', [], $locale),
                route('api.v1.publications.show', $this->content->id)
            ),
        ];
    }
}
