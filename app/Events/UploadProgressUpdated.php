<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class UploadProgressUpdated implements ShouldBroadcast
{
  public function __construct(
    public int $userId,
    public string $uploadId,
    public int $progress,
    public array $stats = []
  ) {}

  public function broadcastOn()
  {
    return new PrivateChannel("users.{$this->userId}");
  }

  public function broadcastAs()
  {
    return 'UploadProgressUpdated';
  }

  public function broadcastWith()
  {
    return [
      'uploadId' => $this->uploadId,
      'progress' => $this->progress,
      'stats' => $this->stats,
    ];
  }
}
