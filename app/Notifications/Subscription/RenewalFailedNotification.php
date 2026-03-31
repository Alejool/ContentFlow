<?php

namespace App\Notifications\Subscription;

use App\Models\Workspace\Workspace;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RenewalFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Workspace $workspace,
        public int $retryCount,
        public string $errorMessage
    ) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        $gracePeriodDays = config('subscription.grace_period_days', 3);

        return (new MailMessage)
            ->subject('Fallo en la renovación de tu suscripción')
            ->greeting("Hola {$notifiable->name},")
            ->line("No pudimos renovar la suscripción de tu workspace \"{$this->workspace->name}\".")
            ->line("Tienes {$gracePeriodDays} días de período de gracia para resolver el problema de pago antes de que tu plan sea degradado al plan gratuito.")
            ->action('Actualizar método de pago', url('/subscription/billing'))
            ->line('Si tienes alguna pregunta, no dudes en contactarnos.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'renewal_failed',
            'workspace_id' => $this->workspace->id,
            'workspace_name' => $this->workspace->name,
            'retry_count' => $this->retryCount,
            'error_message' => $this->errorMessage,
        ];
    }
}
