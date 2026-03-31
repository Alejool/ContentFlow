<?php

namespace App\Events\Subscription;

use App\Models\Workspace\Workspace;
use Carbon\Carbon;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GracePeriodStarted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Workspace $workspace,
        public Carbon $gracePeriodEndsAt
    ) {}
}
