<?php

namespace App\Listeners\Approval;

use App\Events\Approval\ContentApproved;
use App\Events\Approval\ContentRejected;
use App\Notifications\Approval\PublicationApprovedNotification;
use App\Notifications\Approval\PublicationRejectedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

class NotifyContentCreator implements ShouldQueue
{
    /**
     * Handle ContentApproved event.
     */
    public function handleApproved(ContentApproved $event): void
    {
        $creator = $event->content->user;

        if ($creator) {
            $creator->notify(
                new PublicationApprovedNotification(
                    $event->content,
                    $event->approver
                )
            );
        }
    }

    /**
     * Handle ContentRejected event.
     */
    public function handleRejected(ContentRejected $event): void
    {
        $creator = $event->content->user;

        if ($creator) {
            $creator->notify(
                new PublicationRejectedNotification(
                    $event->content,
                    $event->approver,
                    $event->reason
                )
            );
        }
    }
}
