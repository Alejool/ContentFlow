<?php

namespace App\Events;

use App\Models\Publications\Publication;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ApprovalTaskReassigned
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Publication $content;
    public ?User $fromUser;
    public User $toUser;
    public string $reason;
    public int $approvalLevel;

    /**
     * Create a new event instance.
     */
    public function __construct(
        Publication $content,
        ?User $fromUser,
        User $toUser,
        string $reason,
        int $approvalLevel
    ) {
        $this->content = $content;
        $this->fromUser = $fromUser;
        $this->toUser = $toUser;
        $this->reason = $reason;
        $this->approvalLevel = $approvalLevel;
    }
}
