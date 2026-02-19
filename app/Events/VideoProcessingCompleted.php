<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class VideoProcessingCompleted implements ShouldBroadcast
{
  public function __construct(
    public int $userId,
    public int $publicationId,
    public string $status = 'completed',
    public ?string $errorMessage = null
  ) {}

  public function broadcastOn()
  {
    return new PrivateChannel("users.{$this->userId}");
  }

  public function broadcastAs()
  {
    return 'VideoProcessingCompleted';
  }

  public function broadcastWith()
  {
    return [
      'publicationId' => $this->publicationId,
      'status' => $this->status,
      'errorMessage' => $this->errorMessage,
      'completedAt' => now()->timestamp,
    ];
  }
}
