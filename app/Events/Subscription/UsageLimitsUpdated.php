<?php

namespace App\Events\Subscription;

use App\Models\Workspace\Workspace;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UsageLimitsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Workspace $workspace,
        public array $updatedLimits,
        public string $triggerAction = 'usage_updated'
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("workspace.{$this->workspace->id}.limits"),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'usage.limits.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'workspace_id' => $this->workspace->id,
            'limits' => $this->updatedLimits,
            'trigger_action' => $this->triggerAction,
            'timestamp' => now()->toISOString(),
        ];
    }
}