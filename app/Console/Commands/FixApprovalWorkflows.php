<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalLevel;
use Illuminate\Support\Facades\DB;

class FixApprovalWorkflows extends Command
{
    protected $signature = 'approval:fix {--dry-run : Show what would be fixed without making changes}';
    protected $description = 'Fix inconsistent approval workflow data';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
        }

        $this->info('🔧 Checking for approval workflow inconsistencies...');

        $workflows = ApprovalWorkflow::with('levels')->get();
        $fixedCount = 0;

        foreach ($workflows as $workflow) {
            $levelsCount = $workflow->levels->count();
            $hasInconsistency = false;
            $fixes = [];

            // Check is_multi_level consistency
            if (!$workflow->is_multi_level && $levelsCount > 1) {
                $hasInconsistency = true;
                $fixes[] = "Set is_multi_level = true (has {$levelsCount} levels)";
            } elseif ($workflow->is_multi_level && $levelsCount <= 1) {
                $hasInconsistency = true;
                $fixes[] = "Set is_multi_level = false (has {$levelsCount} level(s))";
            }

            // Check for null role_id
            $nullRoleCount = $workflow->levels->where('role_id', null)->count();
            if ($nullRoleCount > 0) {
                $hasInconsistency = true;
                $fixes[] = "Remove {$nullRoleCount} level(s) with null role_id";
            }

            if ($hasInconsistency) {
                $this->warn("❌ Workflow ID {$workflow->id} (Workspace {$workflow->workspace_id}):");
                foreach ($fixes as $fix) {
                    $this->line("   - {$fix}");
                }

                if (!$dryRun) {
                    DB::transaction(function () use ($workflow, $levelsCount) {
                        // Fix is_multi_level flag
                        $correctMultiLevel = $levelsCount > 1;
                        $workflow->update(['is_multi_level' => $correctMultiLevel]);

                        // Remove levels with null role_id
                        ApprovalLevel::where('approval_workflow_id', $workflow->id)
                            ->whereNull('role_id')
                            ->delete();

                        // If no valid levels remain and it was multi-level, disable it
                        $remainingLevels = ApprovalLevel::where('approval_workflow_id', $workflow->id)->count();
                        if ($remainingLevels === 0 && $workflow->is_multi_level) {
                            $workflow->update([
                                'is_multi_level' => false,
                                'is_enabled' => false
                            ]);
                        }
                    });

                    $this->info("   ✅ Fixed");
                }

                $fixedCount++;
            }
        }

        if ($fixedCount === 0) {
            $this->info('✅ No inconsistencies found');
        } else {
            if ($dryRun) {
                $this->info("🔍 Found {$fixedCount} workflow(s) that need fixing");
                $this->info("Run without --dry-run to apply fixes");
            } else {
                $this->info("✅ Fixed {$fixedCount} workflow(s)");
            }
        }

        return 0;
    }
}