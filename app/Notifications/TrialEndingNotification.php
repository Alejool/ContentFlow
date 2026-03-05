<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Subscription\Subscription;

class TrialEndingNotification extends Notification implements ShouldQueue
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
        $daysLeft = now()->diffInDays($this->subscription->trial_ends_at);
        $planName = config("plans.{$this->subscription->plan}.name");

        return (new MailMessage)
            ->subject("Tu prueba de {$planName} termina pronto")
            ->greeting("Hola {$notifiable->name},")
            ->line("Tu prueba gratuita del plan {$planName} termina en {$daysLeft} días.")
            ->line("Para continuar disfrutando de todas las funcionalidades, actualiza tu suscripción.")
            ->action('Actualizar Ahora', url('/subscription/upgrade'))
            ->line('Si no actualizas, tu cuenta será cambiada al plan gratuito automáticamente.');
    }

    public function toArray($notifiable): array
    {
        return [
            'subscription_id' => $this->subscription->id,
            'plan' => $this->subscription->plan,
            'trial_ends_at' => $this->subscription->trial_ends_at,
            'days_left' => now()->diffInDays($this->subscription->trial_ends_at),
        ];
    }
}
