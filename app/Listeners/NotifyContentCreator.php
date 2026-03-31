<?php

namespace App\Listeners;

use App\Events\ContentApproved;
use App\Events\ContentRejected;
use App\Notifications\PublicationApprovedNotification;
use App\Notifications\PublicationRejectedNotification;
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
