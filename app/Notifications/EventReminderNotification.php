<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\UserCalendarEvent;

class EventReminderNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public UserCalendarEvent $event)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [\App\Channels\ExtendedDatabaseChannel::class];
    }

    /**
     * Get the category of the notification.
     */
    public function getCategory(): string
    {
        return 'event';
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'event_reminder',
            'event_id' => $this->event->id,
            'title' => $this->event->title,
            'description' => $this->event->description ?? 'Recordatorio de evento',
            'start_date' => $this->event->start_date->toIso8601String(),
            'workspace_id' => $this->event->workspace_id,
            'category' => 'event',
            'message' => "Recordatorio: {$this->event->title}",
        ];
    }
}
