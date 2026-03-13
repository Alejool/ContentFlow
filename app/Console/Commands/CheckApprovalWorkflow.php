<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalLevel;
use App\Models\Workspace\Workspace;
use App\Models\Role\Role;

class CheckApprovalWorkflow extends Command
{
    protected $signature = 'approval:check {workspace_id?}';
    protected $description = 'Check approval workflow configuration';

    public function handle()
    {
        $workspaceId = $this->argument('workspace_id');
        
        if ($workspaceId) {
            $workspace = Workspace::find($workspaceId);
            if (!$workspace) {
                $this->error("Workspace with ID {$workspaceId} not found");
                return 1;
            }
            $workspaces = collect([$workspace]);
        } else {
            $workspaces = Workspace::all();
        }

        foreach ($workspaces as $workspace) {
            $this->info("=== Workspace: {$workspace->name} (ID: {$workspace->id}) ===");
            
            $workflow = ApprovalWorkflow::where('workspace_id', $workspace->id)->first();
            
            if (!$workflow) {
                $this->warn("  No workflow found");
                continue;
            }

            $this->info("  Workflow ID: {$workflow->id}");
            $this->info("  is_active: " . ($workflow->is_active ? 'true' : 'false'));
            $this->info("  is_enabled: " . ($workflow->is_enabled ? 'true' : 'false'));
            $this->info("  is_multi_level: " . ($workflow->is_multi_level ? 'true' : 'false'));
            
            $levels = $workflow->levels()->orderBy('level_number')->get();
            $this->info("  Levels count: " . $levels->count());
            
            foreach ($levels as $level) {
                $roleName = $level->role ? $level->role->name : 'NO ROLE';
                $roleId = $level->role_id ?? 'NULL';
                $this->info("    * Level {$level->level_number}: {$level->level_name} (Role ID: {$roleId}, Role: {$roleName})");
            }
            
            // Check for inconsistencies
            if (!$workflow->is_multi_level && $levels->count() > 1) {
                $this->error("  ❌ INCONSISTENCY: is_multi_level=false but has {$levels->count()} levels");
            }
            
            if ($workflow->is_multi_level && $levels->count() <= 1) {
                $this->error("  ❌ INCONSISTENCY: is_multi_level=true but has only {$levels->count()} level(s)");
            }
            
            $this->line("");
        }

        // Show available roles
        $this->info("=== Available Roles for Approval ===");
        $roles = Role::where('approval_participant', true)->get();
        foreach ($roles as $role) {
            $this->info("  - {$role->name} ({$role->display_name}) - ID: {$role->id}");
        }

        return 0;
    }
}