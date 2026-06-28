<?php

namespace App\Console\Commands\Approval;

use App\Models\Approval\ApprovalRequest;
use App\Models\Approval\ApprovalLevel;
use App\Models\Logs\ApprovalLog;
use App\Services\Approval\ApprovalWorkflowEngine;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ProcessApprovalTimeouts
 *
 * Scans all pending approval requests and auto-advances any step that has
 * exceeded the configured `timeout_hours` for its current level.
 *
 * This command is the enforcement layer for the `approval_levels.timeout_hours`
 * field which was previously stored but never checked.
 *
 * Schedule: runs hourly via bootstrap/app.php scheduler.
 *
 * Actions taken on timeout:
 * 1. An `auto_advanced` log entry is written with reason `timeout`.
 * 2. The engine advances the request to the next step.
 * 3. If this was the final step, the request is auto-completed.
 */
class ProcessApprovalTimeouts extends Command
{
    protected $signature   = 'approval:process-timeouts {--dry-run : Preview without making changes}';
    protected $description = 'Auto-advance approval steps that have exceeded their configured timeout.';

    public function handle(ApprovalWorkflowEngine $engine): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('[DRY RUN] No changes will be made.');
        }

        // Load all pending requests that have a current step with a timeout configured
        $pendingRequests = ApprovalRequest::with([
            'currentStep',
            'workflow',
            'publication',
        ])
            ->where('status', ApprovalRequest::STATUS_PENDING)
            ->whereNotNull('current_step_id')
            ->get();

        $processed = 0;
        $skipped   = 0;

        foreach ($pendingRequests as $request) {
            $step = $request->currentStep;

            if (!$step || !$step->timeout_hours || $step->timeout_hours <= 0) {
                $skipped++;
                continue;
            }

            // Determine when the step became active (last log entry or submission time)
            $stepActiveSince = ApprovalLog::where('approval_request_id', $request->id)
                ->where('level_number', $step->level_number)
                ->orderByDesc('created_at')
                ->value('created_at') ?? $request->submitted_at;

            $deadlineAt = $stepActiveSince->addHours($step->timeout_hours);

            if (now()->isBefore($deadlineAt)) {
                // Not timed out yet
                $skipped++;
                continue;
            }

            $hoursOverdue = round(now()->diffInMinutes($deadlineAt) / 60, 1);

            $this->warn(sprintf(
                'Request #%d (pub #%d) — Level %d "%s" — %.1f hours overdue',
                $request->id,
                $request->publication_id,
                $step->level_number,
                $step->level_name,
                $hoursOverdue,
            ));

            if ($dryRun) {
                continue;
            }

            try {
                DB::transaction(function () use ($request, $step, $engine) {
                    // Audit: record the timeout event
                    ApprovalLog::create([
                        'approval_request_id' => $request->id,
                        'approval_step_id'    => $step->id,
                        'user_id'             => null,
                        'action'              => ApprovalLog::ACTION_AUTO_ADVANCED,
                        'level_number'        => $step->level_number,
                        'comment'             => "Step auto-advanced due to timeout. "
                            . "Configured timeout: {$step->timeout_hours}h.",
                        'metadata'            => [
                            'reason'          => 'timeout',
                            'timeout_hours'   => $step->timeout_hours,
                            'auto_advanced_at' => now()->toIso8601String(),
                        ],
                    ]);

                    $engine->autoAdvanceToNextStep($request, $step->level_number);
                });

                $this->info("  ✓ Advanced past level {$step->level_number}");
                $processed++;

                Log::info('Approval step auto-advanced due to timeout', [
                    'request_id'    => $request->id,
                    'publication_id' => $request->publication_id,
                    'level'         => $step->level_number,
                    'timeout_hours' => $step->timeout_hours,
                ]);
            } catch (\Throwable $e) {
                $this->error("  ✗ Failed to advance request #{$request->id}: {$e->getMessage()}");
                Log::error('Failed to auto-advance timed-out approval step', [
                    'request_id' => $request->id,
                    'error'      => $e->getMessage(),
                ]);
            }
        }

        $this->info(sprintf(
            'Done. Processed: %d | Skipped (no timeout or not elapsed): %d',
            $processed,
            $skipped,
        ));

        return self::SUCCESS;
    }
}
