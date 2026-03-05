<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subscription\UsageMetric;
use App\Models\Workspace\Workspace;
use App\Services\Usage\UsageTrackingService;

class ResetMonthlyUsage extends Command
{
    protected $signature = 'usage:reset-monthly';
    protected $description = 'Reset monthly usage metrics for all workspaces';

    public function __construct(
        private UsageTrackingService $usageTracking
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Resetting monthly usage metrics...');

        $workspaces = Workspace::with('subscription')->get();
        $count = 0;

        foreach ($workspaces as $workspace) {
            if (!$workspace->subscription) {
                continue;
            }

            $this->usageTracking->resetMonthlyUsage($workspace);
            $count++;
        }

        $this->info("Monthly usage reset successfully for {$count} workspaces");

        return Command::SUCCESS;
    }
}
