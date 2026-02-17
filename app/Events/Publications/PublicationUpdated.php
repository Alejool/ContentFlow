<?php

namespace App\Events\Publications;

use App\Models\Publications\Publication;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

use App\Models\User;

class PublicationUpdated implements ShouldBroadcast
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public $publication;
  public $workspaceId;

  /**
   * Create a new event instance.
   */
  public function __construct(Publication $publication)
  {
    $this->publication = $publication;
    $this->workspaceId = $publication->workspace_id;
  }

  /**
   * Get the channels the event should broadcast on.
   *
   * @return array<int, \Illuminate\Broadcasting\Channel>
   */
  public function broadcastOn(): array
  {
    return [
      new PrivateChannel('workspace.' . $this->workspaceId),
    ];
  }

  public function broadcastAs()
  {
    return 'publication.updated';
  }

  public function broadcastWith()
  {
    return [
      'publication' => [
        'id' => $this->publication->id,
        'title' => $this->publication->title,
        'status' => $this->publication->status,
        'workspace_id' => $this->publication->workspace_id,
        'updated_at' => $this->publication->updated_at,
      ],
    ];
  }
}
