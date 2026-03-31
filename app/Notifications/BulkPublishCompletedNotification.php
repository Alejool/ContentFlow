<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class BulkPublishCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private int $publicationCount,
        private bool $success,
        private int $workspaceId,
        private ?string $error = null
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
            'type' => $this->success ? 'bulk_publish_completed' : 'bulk_publish_failed',
            'publication_count' => $this->publicationCount,
            'success' => $this->success,
            'workspace_id' => $this->workspaceId,
            'error' => $this->error,
            'message' => $this->getMessage(),
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => $this->success ? 'bulk_publish_completed' : 'bulk_publish_failed',
            'publication_count' => $this->publicationCount,
            'success' => $this->success,
            'workspace_id' => $this->workspaceId,
            'error' => $this->error,
            'message' => $this->getMessage(),
        ]);
    }

    private function getMessage(): string
    {
        if ($this->success) {
            if ($this->publicationCount === 1) {
                return "✅ Publicación completada exitosamente.";
            }
            return "✅ Publicación en lote completada: {$this->publicationCount} publicaciones procesadas exitosamente.";
        }

        if ($this->publicationCount === 1) {
            return "❌ Error al publicar. " . ($this->error ? "Razón: {$this->error}" : "Por favor, intenta nuevamente.");
        }
        
        return "❌ Error en publicación en lote. Algunas publicaciones pueden haber fallado. Revisa el estado individual de cada una.";
    }
}
