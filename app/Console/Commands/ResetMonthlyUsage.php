<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Services\Usage\UsageTrackingService;

class ResetMonthlyUsage extends Command
{
    protected $signature   = 'usage:reset-monthly';
    protected $description = 'Reset monthly usage metrics (publications, AI requests) for all workspaces. Storage is recalculated from actual files.';

    public function __construct(
        private UsageTrackingService $usageTracking
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Resetting monthly usage for all workspaces...');

        $workspaces = Workspace::all();
        $success    = 0;
        $failed     = 0;

        foreach ($workspaces as $workspace) {
            try {
                $this->usageTracking->resetMonthlyUsage($workspace);
                $success++;
                $this->line("  ✓ <info>{$workspace->name}</info> (ID: {$workspace->id})");
            } catch (\Exception $e) {
                $failed++;
                $this->line("  ✗ <error>{$workspace->name}</error> — {$e->getMessage()}");
            }
        }

        $this->newLine();
        $this->info("Summary:");
        $this->info("  Workspaces reset: {$success}");
        if ($failed > 0) {
            $this->warn("  Failed: {$failed}");
        }
        $this->info("  Date: " . now()->format('Y-m-d H:i:s'));

        return $failed > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
