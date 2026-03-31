<?php

namespace App\Events\Subscription;

use App\Models\Workspace\Workspace;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubscriptionDowngraded
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Workspace $workspace,
        public string $previousPlan,
        public string $newPlan,
        public string $reason
    ) {}
}
