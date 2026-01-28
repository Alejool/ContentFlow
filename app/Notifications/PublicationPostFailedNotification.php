<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class PublicationPostFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public $platform,
        public $error,
        public $publicationTitle
    ) {}

    public function via(object $notifiable): array
    {
        return ['broadcast', 'database'];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'title' => 'Publication Failed',
            'message' => "Failed to publish to {$this->platform}: {$this->error}",
            'platform' => $this->platform,
            'type' => 'error',
        ]);
    }

    public function toArray(object $notifiable): array
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
