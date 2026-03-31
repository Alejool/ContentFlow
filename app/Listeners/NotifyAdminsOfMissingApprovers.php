<?php

namespace App\Listeners;

use App\Models\Role\Role;
use App\Notifications\MissingApproversNotification;
use App\Services\RoleService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;

class NotifyAdminsOfMissingApprovers implements ShouldQueue
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    /**
     * Handle the event.
     * 
     * This listener can be triggered manually when missing approvers are detected
     * or scheduled to run periodically to check for configuration issues.
     */
    public function handle($event): void
    {
        // Extract data from event
        $content = $event->content ?? null;
        $requiredRole = $event->requiredRole ?? null;
        $approvalLevel = $event->approvalLevel ?? null;

        if (!$content || !$requiredRole || !$approvalLevel) {
            return;
        }

        $workspace = $content->workspace;

        // Get all admins in the workspace
        $admins = $this->roleService->getUsersWithRole($workspace, Role::ADMIN);

        // Also notify the owner
        $owner = $this->roleService->getUsersWithRole($workspace, Role::OWNER);
        $recipients = $admins->merge($owner);

        // Send notification to all admins and owner
        if ($recipients->isNotEmpty()) {
            Notification::send(
                $recipients,
                new MissingApproversNotification(
                    $content,
                    $requiredRole,
                    $approvalLevel
                )
            );
        }
    }
}
