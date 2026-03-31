<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class PublicationStatusUpdated implements ShouldBroadcast
{
  public function __construct(
    public int $userId,
    public int $publicationId,
    public string $status,
    public ?int $workspaceId = null,
    public ?array $socialAccountIds = null
  ) {}

  public function broadcastOn()
  {
    $channels = [new PrivateChannel("users.{$this->userId}")];
    
    // Also broadcast to workspace channel if workspace ID is provided
    if ($this->workspaceId) {
      $channels[] = new PrivateChannel("workspace.{$this->workspaceId}");
    }
    
    return $channels;
  }

  public function broadcastAs()
  {
    return 'PublicationStatusUpdated';
  }
  
  public function broadcastWith()
  {
    return [
      'user_id' => $this->userId,
      'publication_id' => $this->publicationId,
      'status' => $this->status,
      'workspace_id' => $this->workspaceId,
      'social_account_ids' => $this->socialAccountIds,
    ];
  }
}
