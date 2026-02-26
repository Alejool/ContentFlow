<?php

namespace App\Events\Publications;

use App\Models\Publications\PublicationLock;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\PresenceChannel;

class PublicationLockChanged implements ShouldBroadcast
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public $publicationId;
  public $lock;
  public $workspaceId;
  public $broadcastQueue = 'notifications';

  /**
   * Create a new event instance.
   */
  public function __construct($publicationId, $lock, $workspaceId)
  {
    $this->publicationId = $publicationId;
    $currentUserId = auth()->id();
    
    // Handle both PublicationLock objects and arrays (for approval_workflow locks)
    if ($lock === null) {
      $this->lock = null;
    } elseif (is_array($lock)) {
      // Array format (e.g., approval_workflow lock)
      $this->lock = $lock;
    } else {
      // PublicationLock object
      $this->lock = [
        'user_name' => $lock->user->name ?? 'Usuario',
        'user_id' => $lock->user_id,
        'locked_by' => ($lock->user_id === $currentUserId) ? 'session' : 'user',
        'ip_address' => $lock->ip_address,
        'user_agent' => $lock->user_agent,
        'expires_at' => $lock->expires_at ? $lock->expires_at->toIso8601String() : now()->toIso8601String(),
      ];
    }
    
    $this->workspaceId = $workspaceId;
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
      new PresenceChannel('publication.' . $this->publicationId),
    ];
  }

  public function broadcastAs(): string
  {
    return 'publication.lock.changed';
  }

  public function broadcastWith(): array
  {
    return [
      'publicationId' => $this->publicationId,
      'publication_id' => $this->publicationId,
      'lock' => $this->lock,
      'workspaceId' => $this->workspaceId,
    ];
  }
}
