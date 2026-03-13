<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Models\ApprovalWorkflow;

class EnableApprovalWorkflow extends Command
{
    protected $signature = 'approval:enable {workspace_id?}';
    protected $description = 'Enable approval workflow for a workspace';

    public function handle()
    {
        $workspaceId = $this->argument('workspace_id');
        
        if (!$workspaceId) {
            $workspace = Workspace::first();
            if (!$workspace) {
                $this->error('No workspaces found in database');
                return 1;
            }
            $workspaceId = $workspace->id;
        } else {
            $workspace = Workspace::find($workspaceId);
            if (!$workspace) {
                $this->error("Workspace with ID {$workspaceId} not found");
                return 1;
            }
        }

        $this->info("Enabling approval workflow for workspace: {$workspace->name} (ID: {$workspaceId})");

        // Check if workflow already exists
        $workflow = ApprovalWorkflow::where('workspace_id', $workspaceId)->first();
        
        if ($workflow) {
            $this->warn('Workflow already exists for this workspace');
            $workflow->is_active = true;
            $workflow->save();
            $this->info('Workflow has been enabled');
        } else {
            $workflow = ApprovalWorkflow::create([
                'workspace_id' => $workspaceId,
                'is_active' => true,
                'is_multi_level' => false,
            ]);
            $this->info('Workflow created and enabled');
        }

        $this->newLine();
        $this->info('Workflow Details:');
        $this->line("  ID: {$workflow->id}");
        $this->line("  Enabled: " . ($workflow->is_active ? 'YES' : 'NO'));
        $this->line("  Multi-level: " . ($workflow->is_multi_level ? 'YES' : 'NO'));
        
        $this->newLine();
        $this->info('✅ Approval workflow is now active!');
        $this->warn('⚠️  Users with publish permission will now need approval before publishing (except Owner)');

        return 0;
    }
}
