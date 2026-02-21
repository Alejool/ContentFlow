<?php

namespace App\Notifications;

use App\Models\Publications\Publication;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;

class PublicationQueuedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private Publication $publication,
        private int $queuePosition,
        private int $estimatedWaitMinutes
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'publication_queued',
            'publication_id' => $this->publication->id,
            'publication_title' => $this->publication->title,
            'queue_position' => $this->queuePosition,
            'estimated_wait_minutes' => $this->estimatedWaitMinutes,
            'message' => $this->getMessage(),
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'publication_queued',
            'publication_id' => $this->publication->id,
            'publication_title' => $this->publication->title,
            'queue_position' => $this->queuePosition,
            'estimated_wait_minutes' => $this->estimatedWaitMinutes,
            'message' => $this->getMessage(),
        ]);
    }

    private function getMessage(): string
    {
        if ($this->queuePosition <= 3) {
            return "Tu publicación '{$this->publication->title}' está en cola. Comenzará pronto.";
        }
        
        if ($this->estimatedWaitMinutes < 5) {
            return "Tu publicación '{$this->publication->title}' está en cola (posición {$this->queuePosition}). Tiempo estimado: menos de 5 minutos.";
        }
        
        return "Tu publicación '{$this->publication->title}' está en cola (posición {$this->queuePosition}). Tiempo estimado: ~{$this->estimatedWaitMinutes} minutos.";
    }
}
