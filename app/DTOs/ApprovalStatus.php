<?php

namespace App\DTOs;

use Carbon\Carbon;

class ApprovalStatus
{
    public function __construct(
        public readonly string $status,
        public readonly ?int $currentLevel,
        public readonly ?string $nextApproverRole,
        public readonly ?string $lastAction,
        public readonly ?Carbon $lastActionAt,
        public readonly ?string $lastActionBy
    ) {}

    /**
     * Check if the content is pending approval.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending_review';
    }

    /**
     * Check if the approval process is complete.
     */
    public function isComplete(): bool
    {
        return in_array($this->status, ['approved', 'rejected', 'published']);
    }

    /**
     * Check if the content requires action.
     */
    public function requiresAction(): bool
    {
        return $this->status === 'pending_review';
    }

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'current_level' => $this->currentLevel,
            'next_approver_role' => $this->nextApproverRole,
            'last_action' => $this->lastAction,
            'last_action_at' => $this->lastActionAt?->toIso8601String(),
            'last_action_by' => $this->lastActionBy,
        ];
    }
}
