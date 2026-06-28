<?php

namespace App\Notifications\Approval;

use App\Models\Auth\Role;
use App\Models\Publications\Publication;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to workspace admins when a pending approval step is auto-advanced
 * because no eligible approver could be found (e.g., the only user with
 * the required role was removed from the workspace or lost their role).
 */
class NoApproverAvailableNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Publication $publication,
        public int         $skippedLevel,
        public User        $formerApprover,
        public Role        $formerRole,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $workspaceName = $this->publication->workspace?->name ?? 'your workspace';

        return (new MailMessage)
            ->subject("⚠ Approval step auto-advanced — no eligible approver")
            ->greeting("Hello {$notifiable->name},")
            ->line("An approval step was automatically skipped in **{$workspaceName}** because no eligible approver was available.")
            ->line("**Publication:** {$this->publication->title}")
            ->line("**Skipped level:** {$this->skippedLevel}")
            ->line("**Former approver:** {$this->formerApprover->name} ({$this->formerRole->display_name})")
            ->line("The flow has been advanced to the next step automatically so it does not remain blocked. Please review the approval workflow configuration and ensure each level has at least one eligible user assigned.")
            ->action('Review Approval Workflow', url("/workspaces/{$this->publication->workspace_id}/settings?tab=approvals"))
            ->line("This is an automated safety notification.");
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'             => 'no_approver_available',
            'publication_id'   => $this->publication->id,
            'publication_title' => $this->publication->title,
            'skipped_level'    => $this->skippedLevel,
            'former_approver'  => $this->formerApprover->name,
            'former_role'      => $this->formerRole->display_name,
            'message'          => "Approval level {$this->skippedLevel} was auto-advanced: no eligible approver found after role change.",
        ];
    }
}
