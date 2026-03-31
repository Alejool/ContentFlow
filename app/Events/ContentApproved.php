<?php

namespace App\Events;

use App\Models\Publications\Publication;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContentApproved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Publication $content;
    public User $approver;
    public ?int $approvalLevel;
    public ?string $comment;

    /**
     * Create a new event instance.
     */
    public function __construct(Publication $content, User $approver, ?int $approvalLevel = null, ?string $comment = null)
    {
        $this->content = $content;
        $this->approver = $approver;
        $this->approvalLevel = $approvalLevel;
        $this->comment = $comment;
    }
}
