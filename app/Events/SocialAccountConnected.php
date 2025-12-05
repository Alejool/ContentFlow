<?php

namespace App\Events;

use Illuminate\Broadcasting\ShouldBroadcast;
use Illuminate\Broadcasting\PrivateChannel;
use App\Models\SocialAccount;

class SocialAccountConnected implements ShouldBroadcast
{
  public function __construct(public SocialAccount $account) {}

  public function broadcastOn()
  {
    return new PrivateChannel('user.' . $this->account->user_id);
  }
}

