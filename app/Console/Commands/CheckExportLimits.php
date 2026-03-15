<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Services\Subscription\GranularLimitValidator;

class CheckExportLimits extends Command
{
    protected $signature = 'export:check-limits {workspace_id?}';
    protected $description = 'Check export history limits for a workspace';

    public function handle(GranularLimitValidator $validator)
    {
        $workspaceId = $this->argument('workspace_id');

        if ($workspaceId) {
            $workspace = Workspace::find($workspaceId);
            if (!$workspace) {
                $this->error("Workspace {$workspaceId} not found");
                return 1;
            }
            $this->checkWorkspace($workspace, $validator);
        } else {
            $workspaces = Workspace::with('subscription')->get();
            foreach ($workspaces as $workspace) {
                $this->checkWorkspace($workspace, $validator);
                $this->line('---');
            }
        }

        return 0;
    }

    private function checkWorkspace(Workspace $workspace, GranularLimitValidator $validator)
    {
        $this->info("Workspace: {$workspace->name} (ID: {$workspace->id})");
        
        $subscription = $workspace->subscription;
        if ($subscription) {
            $this->line("  Subscription ID: {$subscription->id}");
            $this->line("  Plan: {$subscription->plan}");
            $this->line("  Status: {$subscription->stripe_status}");
        } else {
            $this->warn("  No subscription found");
        }

        $historyDays = $validator->getHistoryDaysLimit($workspace);
        $startDate = $validator->getExportStartDate($workspace);

        $this->line("  History Days Limit: {$historyDays}");
        $this->line("  Export Start Date: {$startDate->format('Y-m-d H:i:s')}");
        
        // Check config
        $plan = $subscription?->plan ?? 'demo';
        $planConfig = config("plans.{$plan}");
        if ($planConfig) {
            $this->line("  Config Found: Yes");
            $this->line("  Config History Days: " . ($planConfig['features']['history_days'] ?? 'NOT SET'));
        } else {
            $this->error("  Config Found: No (using default)");
        }
    }
}
