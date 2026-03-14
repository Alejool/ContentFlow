<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Publications\Publication;
use App\Models\ApprovalWorkflow;

class FixPendingPublications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'publications:fix-pending';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix publications with pending_review status but NULL current_approval_step_id';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Fixing Publications with Pending Review Status ===');
        $this->newLine();

        // Find publications with pending_review status but NULL current_approval_step_id
        // Use withoutGlobalScope to bypass workspace filtering since we're running as a command
        $publications = Publication::withoutGlobalScope('workspace')
            ->where('status', 'pending_review')
            ->whereNull('current_approval_step_id')
            ->with('workspace')
            ->get();

        $this->info("Found {$publications->count()} publications to fix");
        $this->newLine();

        if ($publications->isEmpty()) {
            $this->info('No publications need fixing. All good!');
            return 0;
        }

        $fixed = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($publications as $publication) {
            $this->line("Processing Publication #{$publication->id}: {$publication->title}");
            
            if (!$publication->workspace) {
                $this->warn("  ⚠️  SKIPPED: Publication has no workspace");
                $skipped++;
                $this->newLine();
                continue;
            }
            
            $this->line("  Workspace: {$publication->workspace->name} (ID: {$publication->workspace_id})");
            
            // Find active workflow for this workspace
            $workflow = ApprovalWorkflow::with('levels')
                ->where('workspace_id', $publication->workspace_id)
                ->where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->first();
            
            if (!$workflow) {
                $this->warn("  ⚠️  SKIPPED: No active workflow found for this workspace");
                $skipped++;
                $this->newLine();
                continue;
            }
            
            if ($workflow->levels->isEmpty()) {
                $this->warn("  ⚠️  SKIPPED: Workflow has no levels configured");
                $skipped++;
                $this->newLine();
                continue;
            }
            
            $firstLevel = $workflow->levels->first();
            
            try {
                // Use withoutGlobalScope to ensure the update works
                Publication::withoutGlobalScope('workspace')
                    ->where('id', $publication->id)
                    ->update([
                        'current_approval_step_id' => $firstLevel->id,
                    ]);
                
                $this->info("  ✅ FIXED: Set current_approval_step_id to {$firstLevel->id} ({$firstLevel->level_name})");
                $fixed++;
            } catch (\Exception $e) {
                $this->error("  ❌ ERROR: {$e->getMessage()}");
                $errors++;
            }
            
            $this->newLine();
        }

        $this->info('=== Summary ===');
        $this->line("Total publications processed: {$publications->count()}");
        $this->line("Fixed: {$fixed}");
        $this->line("Skipped: {$skipped}");
        $this->line("Errors: {$errors}");

        if ($fixed > 0) {
            $this->newLine();
            $this->info("✅ Successfully fixed {$fixed} publication(s)!");
        }

        if ($skipped > 0) {
            $this->newLine();
            $this->warn("⚠️  {$skipped} publication(s) were skipped (no workflow or no levels configured)");
        }

        if ($errors > 0) {
            $this->newLine();
            $this->error("❌ {$errors} error(s) occurred during processing");
            return 1;
        }

        return 0;
    }
}
