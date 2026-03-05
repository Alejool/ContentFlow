<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Services\Usage\UsageTrackingService;
use Illuminate\Support\Facades\Log;

class ResetMonthlySubscriptionUsage extends Command
{
    protected $signature = 'subscription:reset-monthly-usage {--workspace-id=}';
    protected $description = 'Reset monthly usage metrics for all workspaces or a specific workspace';

    public function __construct(
        private UsageTrackingService $usageTracking
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $workspaceId = $this->option('workspace-id');

        if ($workspaceId) {
            $workspace = Workspace::find($workspaceId);
            
            if (!$workspace) {
                $this->error("Workspace with ID {$workspaceId} not found.");
                return 1;
            }

            $this->resetWorkspaceUsage($workspace);
            $this->info("Usage reset for workspace: {$workspace->name}");
            
            return 0;
        }

        // Reset for all workspaces with active subscriptions
        $workspaces = Workspace::whereHas('subscription', function ($query) {
            $query->where('stripe_status', 'active')
                  ->orWhereNotNull('trial_ends_at');
        })->get();

        $this->info("Resetting usage for {$workspaces->count()} workspaces...");
        $bar = $this->output->createProgressBar($workspaces->count());

        foreach ($workspaces as $workspace) {
            try {
                $this->resetWorkspaceUsage($workspace);
                $bar->advance();
            } catch (\Exception $e) {
                Log::error("Failed to reset usage for workspace {$workspace->id}", [
                    'error' => $e->getMessage(),
                ]);
                $this->error("\nFailed to reset usage for workspace: {$workspace->name}");
            }
        }

        $bar->finish();
        $this->newLine();
        $this->info('Monthly usage reset completed!');

        return 0;
    }

    private function resetWorkspaceUsage(Workspace $workspace): void
    {
        $this->usageTracking->resetMonthlyUsage($workspace);
        
        Log::info("Monthly usage reset for workspace {$workspace->id}", [
            'workspace_id' => $workspace->id,
            'workspace_name' => $workspace->name,
        ]);
    }
}
