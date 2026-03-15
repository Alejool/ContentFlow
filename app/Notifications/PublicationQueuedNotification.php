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
        private int $estimatedWaitMinutes,
        private ?string $planSlug = null
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
            'plan' => $this->planSlug,
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
            'plan' => $this->planSlug,
            'message' => $this->getMessage(),
        ]);
    }

    private function getMessage(): string
    {
        $planInfo = $this->getPlanInfo();
        
        if ($this->queuePosition <= 3) {
            return "Tu publicación '{$this->publication->title}' está en cola{$planInfo}. Comenzará pronto.";
        }
        
        if ($this->estimatedWaitMinutes < 5) {
            return "Tu publicación '{$this->publication->title}' está en cola (posición {$this->queuePosition}{$planInfo}). Tiempo estimado: menos de 5 minutos.";
        }
        
        return "Tu publicación '{$this->publication->title}' está en cola (posición {$this->queuePosition}{$planInfo}). Tiempo estimado: ~{$this->estimatedWaitMinutes} minutos.";
    }

    private function getPlanInfo(): string
    {
        if (!$this->planSlug) {
            return '';
        }

        $planNames = [
            'enterprise' => 'Prioridad Máxima',
            'professional' => 'Prioridad Alta',
            'growth' => 'Prioridad Media',
            'starter' => 'Prioridad Estándar',
            'free' => '',
            'demo' => '',
        ];

        $planName = $planNames[$this->planSlug] ?? '';
        
        return $planName ? " - {$planName}" : '';
    }
}
