<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Workspace\Workspace;
use App\Models\Subscription\UsageMetric;

class UsageLimitWarningNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Workspace $workspace,
        private string $metricType,
        private UsageMetric $usage
    ) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        $percentage = round($this->usage->getUsagePercentage(), 1);
        $metricName = $this->getMetricName();

        return (new MailMessage)
            ->subject("Advertencia: Límite de {$metricName} alcanzado")
            ->greeting("Hola {$notifiable->name},")
            ->line("Tu workspace '{$this->workspace->name}' ha alcanzado el {$percentage}% del límite de {$metricName}.")
            ->line("Uso actual: {$this->usage->current_usage} / {$this->usage->limit}")
            ->action('Actualizar Plan', url('/subscription/upgrade'))
            ->line('Considera actualizar tu plan para continuar sin interrupciones.');
    }

    public function toArray($notifiable): array
    {
        return [
            'workspace_id' => $this->workspace->id,
            'workspace_name' => $this->workspace->name,
            'metric_type' => $this->metricType,
            'current_usage' => $this->usage->current_usage,
            'limit' => $this->usage->limit,
            'percentage' => $this->usage->getUsagePercentage(),
        ];
    }

    private function getMetricName(): string
    {
        return match($this->metricType) {
            'publications' => 'publicaciones',
            'storage' => 'almacenamiento',
            'ai_requests' => 'solicitudes de IA',
            default => $this->metricType,
        };
    }
}
