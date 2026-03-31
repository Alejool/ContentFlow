<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ApprovalWorkflow;

class MigrateWorkflowActiveToEnabled extends Command
{
    protected $signature = 'approval:migrate-active-to-enabled';
    protected $description = 'Migrate is_active to is_enabled for approval workflows';

    public function handle()
    {
        $this->info('Migrating approval workflows from is_active to is_enabled...');
        
        // Find workflows where is_active=true but is_enabled=false
        $workflows = ApprovalWorkflow::where('is_active', true)
            ->where('is_enabled', false)
            ->get();
        
        if ($workflows->isEmpty()) {
            $this->info('No workflows need migration.');
            return 0;
        }
        
        $this->info("Found {$workflows->count()} workflows to migrate:");
        
        foreach ($workflows as $workflow) {
            $this->line("  - Workspace ID: {$workflow->workspace_id}, Workflow ID: {$workflow->id}");
            $workflow->is_enabled = true;
            $workflow->save();
        }
        
        $this->newLine();
        $this->info("✅ Successfully migrated {$workflows->count()} workflows");
        $this->warn('⚠️  Note: The field is_active is deprecated. Use is_enabled instead.');
        
        return 0;
    }
}
