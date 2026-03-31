<?php

namespace App\Listeners\Subscription;

use App\Events\Subscription\PlanChanged;
use App\Services\Usage\UsageTrackingService;
use Illuminate\Contracts\Queue\ShouldQueue;

class ResetUsageMetrics implements ShouldQueue
{
    public function __construct(
        private UsageTrackingService $usageTracking
    ) {}

    public function handle(PlanChanged $event): void
    {
        // Reset monthly usage when plan changes
        // This ensures clean slate for new plan
        $this->usageTracking->resetMonthlyUsage($event->workspace);
    }
}
