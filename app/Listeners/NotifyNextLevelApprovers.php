<?php

namespace App\Listeners;

use App\Events\ApprovalLevelAdvanced;
use App\Notifications\PublicationAwaitingApprovalNotification;
use App\Services\RoleService;
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
