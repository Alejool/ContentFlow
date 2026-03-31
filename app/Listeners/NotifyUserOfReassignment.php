<?php

namespace App\Listeners;

use App\Events\ApprovalTaskReassigned;
use App\Notifications\ApprovalTaskReassignedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

class NotifyUserOfReassignment implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(ApprovalTaskReassigned $event): void
    {
        // Notify the new user who has been assigned the approval task
        $event->toUser->notify(
            new ApprovalTaskReassignedNotification(
                $event->content,
                $event->fromUser,
                $event->reason,
                $event->approvalLevel
            )
        );
    }
}
