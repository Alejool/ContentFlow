<?php

namespace App\Events;

use App\Models\Publications\Publication;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContentSubmittedForApproval
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Publication $content;
    public User $submitter;

    /**
     * Create a new event instance.
     */
    public function __construct(Publication $content, User $submitter)
    {
        $this->content = $content;
        $this->submitter = $submitter;
    }
}
