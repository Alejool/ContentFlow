<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class PublicationStatusUpdated implements ShouldBroadcast
{
  public function __construct(
    public int $publicationId,
  ) {}

  public function broadcastOn()
  {
    return new PrivateChannel('publication.' . $this->publicationId);
  }

  public function broadcastAs()
  {
    return 'PublicationStatusUpdated';
  }
}
