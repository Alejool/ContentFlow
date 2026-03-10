<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Services\Subscription\UsageLimitsNotificationService;

class RefreshWorkspaceLimits extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'limits:refresh {workspace_id?} {--all}';

    /**
     * The console command description.
     */
    protected $description = 'Refresh and broadcast usage limits for workspace(s)';

    public function __construct(
        private UsageLimitsNotificationService $notificationService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('all')) {
            $this->refreshAllWorkspaces();
        } elseif ($workspaceId = $this->argument('workspace_id')) {
            $this->refreshWorkspace($workspaceId);
        } else {
            $this->error('Please provide a workspace ID or use --all flag');
            return 1;
        }

        return 0;
    }

    private function refreshAllWorkspaces(): void
    {
        $this->info('Refreshing limits for all workspaces...');
        
        Workspace::with('subscription')->chunk(100, function ($workspaces) {
            foreach ($workspaces as $workspace) {
                $this->notificationService->notifyLimitsUpdated($workspace, 'manual_refresh');
                $this->line("✓ Refreshed limits for workspace: {$workspace->name} (ID: {$workspace->id})");
            }
        });

        $this->info('All workspace limits refreshed successfully!');
    }

    private function refreshWorkspace(int $workspaceId): void
    {
        $workspace = Workspace::with('subscription')->find($workspaceId);

        if (!$workspace) {
            $this->error("Workspace with ID {$workspaceId} not found");
            return;
        }

        $this->notificationService->notifyLimitsUpdated($workspace, 'manual_refresh');
        $this->info("✓ Refreshed limits for workspace: {$workspace->name} (ID: {$workspace->id})");
    }
}