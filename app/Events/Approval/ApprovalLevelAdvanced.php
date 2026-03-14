<?php

namespace App\Events\Approval;

use App\Models\Publications\Publication;
use App\Models\ApprovalLevel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ApprovalLevelAdvanced implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Publication $publication,
        public ApprovalLevel $fromLevel,
        public ApprovalLevel $toLevel
    ) {
        //
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('workspace.' . $this->publication->workspace_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'approval.level.advanced';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'publication_id' => $this->publication->id,
            'from_level' => [
                'id' => $this->fromLevel->id,
                'number' => $this->fromLevel->level_number,
                'name' => $this->fromLevel->level_name,
            ],
            'to_level' => [
                'id' => $this->toLevel->id,
                'number' => $this->toLevel->level_number,
                'name' => $this->toLevel->level_name,
            ],
            'current_approval_step_id' => $this->publication->current_approval_step_id,
            'status' => $this->publication->status,
        ];
    }
}
