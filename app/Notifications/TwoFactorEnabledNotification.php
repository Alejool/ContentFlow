<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TwoFactorEnabledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private string $ipAddress;
    private string $userAgent;
    private string $timestamp;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $ipAddress, string $userAgent)
    {
        $this->ipAddress = $ipAddress;
        $this->userAgent = $userAgent;
        $this->timestamp = now()->format('Y-m-d H:i:s');
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Two-Factor Authentication Enabled')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Two-factor authentication has been successfully enabled for your account.')
            ->line('This adds an extra layer of security to your account.')
            ->line('**Security Details:**')
            ->line('- Time: ' . $this->timestamp)
            ->line('- IP Address: ' . $this->ipAddress)
            ->line('- Device: ' . $this->userAgent)
            ->line('If you did not enable 2FA, please contact support immediately and change your password.')
            ->action('View Account Security', url('/profile'))
            ->line('Thank you for keeping your account secure!');
    }
}
