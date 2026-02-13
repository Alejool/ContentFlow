<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

use App\Channels\ExtendedDatabaseChannel;

class PublicationStatusUpdate extends BaseNotification
{
    /**
     * Create a new notification instance.
     */
    public function __construct(public $log, public $statusData)
    {
        //
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray($notifiable): array
    {
        $publication = $this->log->publication;
        $campaign = $publication ? $publication->campaigns->first() : null;
        $account = $this->log->socialAccount;
        // Determine locale
        $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

        return [
            'type' => 'status_update',
            'publication_id' => $this->log->publication_id,
            'status' => $this->statusData['status'],
            'log_id' => $this->log->id,
            'platform' => $this->log->platform,
            'message' => trans('notifications.status_update', ['platform' => $this->log->platform], $locale),
            'description' => $this->statusData['message'] ?? 'Status update available',
            'details' => $this->statusData['details'] ?? [],
            'title' => $publication ? $publication->title : 'Untitled Publication',
            'campaign_id' => $campaign ? $campaign->id : null,
            'campaign_name' => $campaign ? $campaign->name : null,
            'account_name' => $account ? $account->name : 'Unknown Account',
        ];
    }
}
