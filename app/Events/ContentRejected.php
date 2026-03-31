<?php

namespace App\Events;

use App\Models\Publications\Publication;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContentRejected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Publication $content;
    public User $approver;
    public string $reason;
    public ?int $approvalLevel;

    /**
     * Create a new event instance.
     */
    public function __construct(Publication $content, User $approver, string $reason, ?int $approvalLevel = null)
    {
        $this->content = $content;
        $this->approver = $approver;
        $this->reason = $reason;
        $this->approvalLevel = $approvalLevel;
    }
}
