<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Services\WorkspaceUsageService;

class ResetMonthlyUsage extends Command
{
    protected $signature = 'usage:reset-monthly';
    protected $description = 'Reset monthly usage metrics for all workspaces';

    public function __construct(
        private WorkspaceUsageService $usageService
    ) {
        parent::__construct();
    }

    public function handle()
    {
        $this->info('Resetting monthly usage for all workspaces...');
        
        $workspaces = Workspace::all();
        $count = 0;
        
        foreach ($workspaces as $workspace) {
            try {
                $this->usageService->resetMonthlyUsage($workspace);
                $count++;
                $this->info("✓ Reset usage for workspace: {$workspace->name} (ID: {$workspace->id})");
            } catch (\Exception $e) {
                $this->error("✗ Failed to reset usage for workspace: {$workspace->name}");
                $this->error("  Error: {$e->getMessage()}");
            }
        }
        
        $this->newLine();
        $this->info("Summary:");
        $this->info("- Total workspaces processed: {$count}");
        $this->info("- Date: " . now()->format('Y-m-d H:i:s'));
        
        return 0;
    }
}
