<?php

namespace App\Events;

use App\Models\Publications\Publication;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ApprovalLevelAdvanced
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Publication $content;
    public int $fromLevel;
    public int $toLevel;
    public User $approver;
    public string $nextApproverRole;

    /**
     * Create a new event instance.
     */
    public function __construct(
        Publication $content,
        int $fromLevel,
        int $toLevel,
        User $approver,
        string $nextApproverRole
    ) {
        $this->content = $content;
        $this->fromLevel = $fromLevel;
        $this->toLevel = $toLevel;
        $this->approver = $approver;
        $this->nextApproverRole = $nextApproverRole;
    }
}
