<?php

namespace App\Listeners\Approval;

use App\Events\Approval\ApprovalLevelAdvanced;
use App\Notifications\Approval\PublicationAwaitingApprovalNotification;
use App\Services\Roles\RoleService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;

class NotifyNextLevelApprovers implements ShouldQueue
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(ApprovalLevelAdvanced $event): void
    {
        $workspace = $event->content->workspace;
        
        // Get all users with the next approver role
        $approvers = $this->roleService->getUsersWithRole(
            $workspace,
            $event->nextApproverRole
        );

        // Send notification to all approvers
        if ($approvers->isNotEmpty()) {
            Notification::send(
                $approvers,
                new PublicationAwaitingApprovalNotification(
                    $event->content,
                    $event->toLevel
                )
            );
        }
    }
}
