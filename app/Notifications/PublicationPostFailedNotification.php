<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class PublicationPostFailedNotification extends BaseNotification
{
    public function __construct(
        public $platform,
        public $error,
        public $publicationTitle
    ) {
        $this->priority = self::PRIORITY_HIGH;
        $this->platform = $platform;
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => 'Publication Failed',
            'message' => "Failed to publish to {$this->platform}: {$this->error}",
            'publication_title' => $this->publicationTitle,
            'platform' => $this->platform,
            'type' => 'error',
        ];
    }
}
