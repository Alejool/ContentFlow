<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class BulkPublishStartedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private string $batchId,
        private int $publicationCount,
        private string $planSlug,
        private int $workspaceId
    ) {
        $this->onQueue('notifications');
    }

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'bulk_publish_started',
            'batch_id' => $this->batchId,
            'publication_count' => $this->publicationCount,
            'plan' => $this->planSlug,
            'workspace_id' => $this->workspaceId,
            'message' => $this->getMessage(),
            'priority_info' => $this->getPriorityInfo(),
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'bulk_publish_started',
            'batch_id' => $this->batchId,
            'publication_count' => $this->publicationCount,
            'plan' => $this->planSlug,
            'workspace_id' => $this->workspaceId,
            'message' => $this->getMessage(),
            'priority_info' => $this->getPriorityInfo(),
        ]);
    }

    private function getMessage(): string
    {
        $priorityInfo = $this->getPriorityInfo();
        
        if ($this->publicationCount === 1) {
            return "Publicación en proceso{$priorityInfo}. Te notificaremos cuando termine.";
        }
        
        return "Publicación en lote iniciada: {$this->publicationCount} publicaciones{$priorityInfo}. Te notificaremos cuando termine.";
    }

    private function getPriorityInfo(): string
    {
        $priorities = [
            'enterprise' => ' con prioridad máxima',
            'professional' => ' con alta prioridad',
            'growth' => ' con prioridad media',
            'starter' => '',
            'free' => '',
            'demo' => '',
        ];

        return $priorities[$this->planSlug] ?? '';
    }
}
