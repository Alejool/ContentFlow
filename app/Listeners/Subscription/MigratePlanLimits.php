<?php

namespace App\Listeners\Subscription;

use App\Events\Subscription\PlanChanged;
use App\Services\Subscription\PlanMigrationService;
use Illuminate\Contracts\Queue\ShouldQueue;

class MigratePlanLimits implements ShouldQueue
{
    public function __construct(
        private PlanMigrationService $migrationService
    ) {}

    public function handle(PlanChanged $event): void
    {
        // The migration is already done in the service
        // This listener can be used for additional actions
        // like sending notifications, logging, etc.
    }
}
