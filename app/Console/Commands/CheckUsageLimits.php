<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Services\Subscription\PlanLimitValidator;
use App\Services\Subscription\LimitNotificationService;
use Illuminate\Support\Facades\Log;

class CheckUsageLimits extends Command
{
    protected $signature = 'subscription:check-limits {--notify}';
    protected $description = 'Check usage limits for all workspaces and optionally send notifications';

    public function __construct(
        private PlanLimitValidator $validator,
        private LimitNotificationService $notificationService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $notify = $this->option('notify');

        $workspaces = Workspace::whereHas('subscription', function ($query) {
            $query->where('stripe_status', 'active')
                  ->orWhereNotNull('trial_ends_at');
        })->get();

        $this->info("Checking limits for {$workspaces->count()} workspaces...");
        
        $limitTypes = ['publications', 'social_accounts', 'storage', 'ai_requests', 'team_members'];
        $warnings = [];
        $exceeded = [];

        foreach ($workspaces as $workspace) {
            foreach ($limitTypes as $limitType) {
                $percentage = $this->validator->getUsagePercentage($workspace, $limitType);
                
                if ($percentage >= 100) {
                    $exceeded[] = [
                        'workspace' => $workspace->name,
                        'limit_type' => $limitType,
                        'percentage' => $percentage,
                    ];

                    if ($notify) {
                        $this->notificationService->checkAndNotify($workspace, $limitType);
                    }
                } elseif ($percentage >= 80) {
                    $warnings[] = [
                        'workspace' => $workspace->name,
                        'limit_type' => $limitType,
                        'percentage' => round($percentage, 2),
                    ];

                    if ($notify) {
                        $this->notificationService->checkAndNotify($workspace, $limitType);
                    }
                }
            }
        }

        // Display results
        if (!empty($exceeded)) {
            $this->error("\nLimits Exceeded (" . count($exceeded) . "):");
            $this->table(
                ['Workspace', 'Limit Type', 'Usage %'],
                array_map(fn($item) => [
                    $item['workspace'],
                    $item['limit_type'],
                    $item['percentage'] . '%'
                ], $exceeded)
            );
        }

        if (!empty($warnings)) {
            $this->warn("\nWarnings (>80% usage) (" . count($warnings) . "):");
            $this->table(
                ['Workspace', 'Limit Type', 'Usage %'],
                array_map(fn($item) => [
                    $item['workspace'],
                    $item['limit_type'],
                    $item['percentage'] . '%'
                ], $warnings)
            );
        }

        if (empty($exceeded) && empty($warnings)) {
            $this->info("\nAll workspaces are within their limits!");
        }

        if ($notify) {
            $this->info("\nNotifications sent to affected workspaces.");
        }

        return 0;
    }
}
