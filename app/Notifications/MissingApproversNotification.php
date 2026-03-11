<?php

namespace App\Notifications;

use App\Models\Workspace\Workspace;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MissingApproversNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Workspace $workspace,
        public array $missingLevels
    ) {}

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
        $levelsList = collect($this->missingLevels)
            ->map(fn($level) => "- Level {$level['level_number']}: {$level['level_name']} (requires {$level['role_name']})")
            ->join("\n");

        return (new MailMessage)
            ->subject("Approval Workflow Configuration Issue - {$this->workspace->name}")
            ->greeting("Hello {$notifiable->name},")
            ->line("There is a configuration issue with the approval workflow in workspace **{$this->workspace->name}**.")
            ->line("The following approval levels have no users assigned to the required roles:")
            ->line($levelsList)
            ->line("Content pending approval at these levels may be stuck. Please assign users to the required roles or reconfigure the approval workflow.")
            ->action('Manage Workspace', url("/workspaces/{$this->workspace->id}/settings/approval-workflow"))
            ->line('Thank you for maintaining your workspace!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'missing_approvers',
            'workspace_id' => $this->workspace->id,
            'workspace_name' => $this->workspace->name,
            'missing_levels' => $this->missingLevels,
            'message' => "Approval workflow in {$this->workspace->name} has levels with no approvers assigned.",
        ];
    }
}
