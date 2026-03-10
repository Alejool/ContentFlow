<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Services\Subscription\UsageLimitsNotificationService;

class TestUsageEvent extends Command
{
    protected $signature = 'test:usage-event {workspace_id?}';
    protected $description = 'Test usage limits WebSocket event';

    public function handle(UsageLimitsNotificationService $service)
    {
        $workspaceId = $this->argument('workspace_id') ?? Workspace::first()?->id;
        
        if (!$workspaceId) {
            $this->error('No workspace found');
            return 1;
        }

        $workspace = Workspace::find($workspaceId);
        
        if (!$workspace) {
            $this->error("Workspace {$workspaceId} not found");
            return 1;
        }

        $this->info("Sending test usage event for workspace: {$workspace->id}");
        
        $service->notifyLimitsUpdated($workspace, 'test_event');
        
        $this->info("Event sent! Check your browser console for WebSocket message.");
        $this->info("Channel: workspace.{$workspace->id}.limits");
        $this->info("Event: usage.limits.updated");
        
        return 0;
    }
}
