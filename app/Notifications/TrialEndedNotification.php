<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Subscription\Subscription;

class TrialEndedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Subscription $subscription
    ) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Tu prueba gratuita ha terminado')
            ->greeting("Hola {$notifiable->name},")
            ->line('Tu prueba gratuita ha terminado y tu cuenta ha sido cambiada al plan gratuito.')
            ->line('Puedes continuar usando ContentFlow con las funcionalidades del plan gratuito.')
            ->action('Ver Planes', url('/subscription/plans'))
            ->line('Actualiza en cualquier momento para desbloquear más funcionalidades.');
    }

    public function toArray($notifiable): array
    {
        return [
            'subscription_id' => $this->subscription->id,
            'old_plan' => $this->subscription->plan,
            'new_plan' => 'free',
        ];
    }
}
