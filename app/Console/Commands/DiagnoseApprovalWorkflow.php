<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalLevel;
use App\Models\Workspace\Workspace;
use App\Models\Role\Role;
use Illuminate\Support\Facades\DB;

class DiagnoseApprovalWorkflow extends Command
{
    protected $signature = 'approval:diagnose {workflow_id}';
    protected $description = 'Diagnose and fix a specific approval workflow';

    public function handle()
    {
        $workflowId = $this->argument('workflow_id');
        
        $workflow = ApprovalWorkflow::with(['levels.role', 'workspace'])->find($workflowId);
        
        if (!$workflow) {
            $this->error("Workflow with ID {$workflowId} not found");
            return 1;
        }

        $this->info("=== Diagnosing Workflow ID {$workflowId} ===");
        $this->info("Workspace: {$workflow->workspace->name} (ID: {$workflow->workspace_id})");
        $this->info("Name: {$workflow->name}");
        $this->info("is_active: " . ($workflow->is_active ? 'true' : 'false'));
        $this->info("is_enabled: " . ($workflow->is_enabled ? 'true' : 'false'));
        $this->info("is_multi_level: " . ($workflow->is_multi_level ? 'true' : 'false'));
        
        $levels = $workflow->levels()->orderBy('level_number')->get();
        $this->info("Levels count: " . $levels->count());
        
        $problems = [];
        
        foreach ($levels as $level) {
            $roleName = $level->role ? $level->role->name : 'NULL';
            $roleId = $level->role_id ?? 'NULL';
            $this->info("  Level {$level->level_number}: {$level->level_name} (Role ID: {$roleId}, Role: {$roleName})");
            
            if (!$level->role_id) {
                $problems[] = "Level {$level->level_number} has null role_id";
            }
        }
        
        // Check for logical inconsistencies
        if (!$workflow->is_multi_level && $levels->count() > 1) {
            $problems[] = "is_multi_level=false but has {$levels->count()} levels";
        }
        
        if ($workflow->is_multi_level && $levels->count() <= 1) {
            $problems[] = "is_multi_level=true but has only {$levels->count()} level(s)";
        }
        
        if (!$workflow->is_enabled && $workflow->is_active) {
            $problems[] = "Workflow is active but not enabled";
        }
        
        if (empty($problems)) {
            $this->info("✅ No problems found");
            return 0;
        }
        
        $this->warn("❌ Problems found:");
        foreach ($problems as $problem) {
            $this->line("  - {$problem}");
        }
        
        if ($this->confirm('Do you want to fix these problems?')) {
            $this->fixWorkflow($workflow, $levels);
        }
        
        return 0;
    }
    
    private function fixWorkflow(ApprovalWorkflow $workflow, $levels)
    {
        DB::transaction(function () use ($workflow, $levels) {
            // Remove levels with null role_id
            $nullRoleLevels = $levels->where('role_id', null);
            foreach ($nullRoleLevels as $level) {
                $this->info("Removing level {$level->level_number} with null role_id");
                $level->delete();
            }
            
            // Refresh levels after deletion
            $remainingLevels = ApprovalLevel::where('approval_workflow_id', $workflow->id)->count();
            
            // Fix is_multi_level flag
            $correctMultiLevel = $remainingLevels > 1;
            if ($workflow->is_multi_level !== $correctMultiLevel) {
                $this->info("Setting is_multi_level to " . ($correctMultiLevel ? 'true' : 'false'));
                $workflow->update(['is_multi_level' => $correctMultiLevel]);
            }
            
            // If workflow is active but not enabled, enable it
            if ($workflow->is_active && !$workflow->is_enabled) {
                $this->info("Enabling workflow since it's active");
                $workflow->update(['is_enabled' => true]);
            }
            
            // If no levels remain and it was supposed to be multi-level, disable it
            if ($remainingLevels === 0 && $workflow->is_multi_level) {
                $this->info("No valid levels remain, disabling multi-level workflow");
                $workflow->update([
                    'is_multi_level' => false,
                    'is_enabled' => false
                ]);
            }
        });
        
        $this->info("✅ Workflow fixed successfully");
    }
}