<?php

namespace App\Notifications;

use App\Models\Social\SocialAccount;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SocialTokenExpiryNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly SocialAccount $account,
        private readonly int $daysRemaining,
    ) {}

    /**
     * Channels: database always; mail only when 1 day remains.
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if ($this->daysRemaining <= 1) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $platformLabel = ucfirst($this->account->platform);
        $accountName   = $this->account->account_name;
        $daysLabel     = $this->daysRemaining === 0 ? 'hoy' : "en {$this->daysRemaining} día(s)";

        return (new MailMessage)
            ->subject("⚠️ Tu conexión de {$platformLabel} vence {$daysLabel}")
            ->greeting("Hola {$notifiable->name},")
            ->line("Tu cuenta **{$accountName}** en **{$platformLabel}** perderá acceso {$daysLabel}.")
            ->line('Si no la reconectas, las publicaciones programadas en esa cuenta fallarán silenciosamente.')
            ->action('Reconectar cuenta', url('/social-accounts'))
            ->line('Puedes reconectar la cuenta desde la sección de Cuentas Conectadas en menos de un minuto.');
    }

    public function toDatabase(object $notifiable): array
    {
        $daysLabel = $this->daysRemaining === 0
            ? 'hoy'
            : "en {$this->daysRemaining} día(s)";

        return [
            'type'          => 'token_expiry_warning',
            'platform'      => $this->account->platform,
            'account_name'  => $this->account->account_name,
            'account_id'    => $this->account->id,
            'days_remaining' => $this->daysRemaining,
            'message'       => "Tu cuenta {$this->account->account_name} ({$this->account->platform}) vence {$daysLabel}.",
            'action_url'    => '/social-accounts',
        ];
    }
}
