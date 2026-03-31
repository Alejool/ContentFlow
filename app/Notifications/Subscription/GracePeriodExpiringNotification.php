<?php

namespace App\Notifications\Subscription;

use App\Models\Workspace\Workspace;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GracePeriodExpiringNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Workspace $workspace,
        public Carbon $gracePeriodEndsAt
    ) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        $daysLeft = (int) now()->diffInDays($this->gracePeriodEndsAt, false);
        $daysLeft = max(0, $daysLeft);
        $expiresAt = $this->gracePeriodEndsAt->format('d/m/Y H:i');

        return (new MailMessage)
            ->subject('⚠️ Tu período de gracia vence pronto')
            ->greeting("Hola {$notifiable->name},")
            ->line("El período de gracia de tu workspace \"{$this->workspace->name}\" vence en {$daysLeft} día(s) ({$expiresAt}).")
            ->line('Si no resuelves el problema de pago antes de esa fecha, tu plan será degradado automáticamente al plan gratuito.')
            ->action('Resolver problema de pago', url('/subscription/billing'))
            ->line('Actualiza tu método de pago para mantener el acceso a todas las funcionalidades de tu plan actual.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'grace_period_expiring',
            'workspace_id' => $this->workspace->id,
            'workspace_name' => $this->workspace->name,
            'grace_period_ends_at' => $this->gracePeriodEndsAt->toIso8601String(),
            'days_left' => max(0, (int) now()->diffInDays($this->gracePeriodEndsAt, false)),
        ];
    }
}
