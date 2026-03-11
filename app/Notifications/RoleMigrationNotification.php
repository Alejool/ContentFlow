<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RoleMigrationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public readonly string $workspaceName,
        public readonly string $oldRole,
        public readonly string $newRole,
        public readonly string $explanation
    ) {
        $this->onQueue('notifications');
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your Role Has Been Updated in ' . $this->workspaceName)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('We have simplified our role structure to make team management easier.')
            ->line('Your role in **' . $this->workspaceName . '** has been updated:')
            ->line('**Previous Role:** ' . $this->oldRole)
            ->line('**New Role:** ' . $this->newRole)
            ->line($this->explanation)
            ->line('This change does not affect your access to existing content. If you have any questions, please contact your workspace administrator.')
            ->action('View Workspace', url('/workspaces/' . $this->workspaceName))
            ->line('Thank you for using ContentFlow!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'role_migration',
            'workspace_name' => $this->workspaceName,
            'old_role' => $this->oldRole,
            'new_role' => $this->newRole,
            'explanation' => $this->explanation,
        ];
    }
}

