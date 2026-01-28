<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class PublicationStatusUpdated implements ShouldBroadcast
{
  public function __construct(
    public int $userId,
    public int $publicationId,
    public string $status
  ) {}

  public function broadcastOn()
  {
    return new PrivateChannel("users.{$this->userId}");
  }

  public function broadcastAs()
  {
    return 'PublicationStatusUpdated';
  }
}
