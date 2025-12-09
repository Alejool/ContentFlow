<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

use App\Channels\ExtendedDatabaseChannel;

class PublicationStatusUpdate extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $log, public $statusData)
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
        return [ExtendedDatabaseChannel::class];
    }

    /**
     * Get the category of the notification.
     */
    public function getCategory(): string
    {
        return 'application';
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'status_update',
            'publication_id' => $this->log->publication_id,
            'log_id' => $this->log->id,
            'platform' => $this->log->platform,
            'status' => $this->statusData['status'], // e.g., 'rejected', 'copyright_claim'
            'message' => $this->statusData['message'] ?? 'Status update available',
            'details' => $this->statusData['details'] ?? [],
            'title' => $this->log->publication->title ?? 'Untitled Publication',
            'category' => 'application', // Keep it in data as well for frontend compatibility if needed
        ];
    }
}
