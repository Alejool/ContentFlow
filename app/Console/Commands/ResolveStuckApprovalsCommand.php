<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use App\Models\Workspace;
use App\Services\ApprovalReassignmentService;
use App\Services\ApprovalWorkflowService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ResolveStuckApprovalsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'approvals:resolve-stuck 
                            {--workspace= : Resolve stuck approvals for specific workspace ID}
                            {--auto-advance : Automatically advance stuck content to next level}
                            {--dry-run : Show stuck approvals without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find and resolve content stuck in approval workflow due to missing approvers';

    /**
     * Execute the console command.
     */
    public function handle(
        ApprovalReassignmentService $reassignmentService,
        ApprovalWorkflowService $workflowService
    ): int {
        $this->info('Scanning for stuck approvals...');
        $this->newLine();

        $workspaceId = $this->option('workspace');
        $autoAdvance = $this->option('auto-advance');
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        try {
            // Get workspaces to check
            $workspaces = $workspaceId 
                ? [Workspace::findOrFail($workspaceId)]
                : Workspace::all();

            $totalStuck = 0;
            $totalResolved = 0;
            $stuckContent = [];

            foreach ($workspaces as $workspace) {
                $stuck = $this->findStuckContent($workspace, $workflowService);
                
                if ($stuck->isNotEmpty()) {
                    $totalStuck += $stuck->count();
                    $stuckContent[$workspace->id] = $stuck;
                }
            }

            if ($totalStuck === 0) {
                $this->info('✓ No stuck approvals found!');
                return Command::SUCCESS;
            }

            // Display stuck content
            $this->warn("Found {$totalStuck} stuck approval(s)");
            $this->newLine();

            foreach ($stuckContent as $workspaceId => $content) {
                $workspace = Workspace::find($workspaceId);
                $this->info("Workspace: {$workspace->name} (ID: {$workspaceId})");
                
                $tableData = [];
                foreach ($content as $item) {
                    $tableData[] = [
                        $item->id,
                        $item->title ?? 'Untitled',
                        $item->current_approval_level,
                        $item->submitted_for_approval_at?->diffForHumans() ?? 'N/A',
                        $this->getStuckReason($item, $workspace, $workflowService)
                    ];
                }

                $this->table(
                    ['Content ID', 'Title', 'Level', 'Submitted', 'Issue'],
                    $tableData
                );
                $this->newLine();
            }

            if ($dryRun) {
                $this->comment('Dry run complete - no changes made');
                return Command::SUCCESS;
            }

            // Resolve stuck approvals
            if ($autoAdvance) {
                $this->info('Auto-advancing stuck content...');
                $totalResolved = $this->autoAdvanceStuckContent($stuckContent, $reassignmentService);
                $this->newLine();
                $this->info("✓ Resolved {$totalResolved} stuck approval(s)");
            } else {
                // Interactive resolution
                $totalResolved = $this->interactiveResolve($stuckContent, $reassignmentService, $workflowService);
            }

            Log::info('Stuck approvals resolved', [
                'total_stuck' => $totalStuck,
                'total_resolved' => $totalResolved
            ]);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Failed to resolve stuck approvals: ' . $e->getMessage());
            Log::error('Resolve stuck approvals failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Command::FAILURE;
        }
    }

    /**
     * Find content stuck in approval workflow
     */
    private function findStuckContent(Workspace $workspace, ApprovalWorkflowService $workflowService)
    {
        $workflow = $workspace->approvalWorkflow;
        
        if (!$workflow || !$workflow->is_enabled) {
            return collect();
        }

        // Find pending content
        $pendingContent = Publication::where('workspace_id', $workspace->id)
            ->where('status', Publication::STATUS_PENDING_REVIEW)
            ->with(['user'])
            ->get();

        // Filter to only stuck content (no available approvers)
        return $pendingContent->filter(function ($content) use ($workflow, $workflowService) {
            return $this->isContentStuck($content, $workflow, $workflowService);
        });
    }

    /**
     * Check if content is stuck (no available approvers)
     */
    private function isContentStuck($content, $workflow, ApprovalWorkflowService $workflowService): bool
    {
        if ($workflow->is_multi_level) {
            $level = $workflow->levels()
                ->where('level_number', $content->current_approval_level)
                ->first();
            
            if (!$level) {
                return true; // Level doesn't exist
            }

            // Check if any users have the required role
            $usersWithRole = DB::table('role_user')
                ->where('workspace_id', $content->workspace_id)
                ->where('role_id', $level->role_id)
                ->count();

            return $usersWithRole === 0;
        } else {
            // Simple workflow - check for users with publish permission
            $usersWithPermission = DB::table('role_user')
                ->join('role_permission', 'role_user.role_id', '=', 'role_permission.role_id')
                ->join('permissions', 'role_permission.permission_id', '=', 'permissions.id')
                ->where('role_user.workspace_id', $content->workspace_id)
                ->where('permissions.name', 'publish_content')
                ->count();

            return $usersWithPermission === 0;
        }
    }

    /**
     * Get reason why content is stuck
     */
    private function getStuckReason($content, Workspace $workspace, ApprovalWorkflowService $workflowService): string
    {
        $workflow = $workspace->approvalWorkflow;

        if ($workflow->is_multi_level) {
            $level = $workflow->levels()
                ->where('level_number', $content->current_approval_level)
                ->first();
            
            if (!$level) {
                return 'Approval level no longer exists';
            }

            return "No users with required role: {$level->role->display_name}";
        }

        return 'No users with publish permission';
    }

    /**
     * Auto-advance stuck content
     */
    private function autoAdvanceStuckContent($stuckContent, ApprovalReassignmentService $reassignmentService): int
    {
        $resolved = 0;

        foreach ($stuckContent as $workspaceId => $content) {
            $workspace = Workspace::find($workspaceId);
            
            foreach ($content as $item) {
                try {
                    // Advance past the stuck level
                    $reassignmentService->advanceContentPastRemovedLevel(
                        $workspace,
                        $item->current_approval_level
                    );
                    $resolved++;
                } catch (\Exception $e) {
                    $this->error("Failed to advance content {$item->id}: {$e->getMessage()}");
                }
            }
        }

        return $resolved;
    }

    /**
     * Interactive resolution of stuck content
     */
    private function interactiveResolve(
        $stuckContent,
        ApprovalReassignmentService $reassignmentService,
        ApprovalWorkflowService $workflowService
    ): int {
        $resolved = 0;

        foreach ($stuckContent as $workspaceId => $content) {
            $workspace = Workspace::find($workspaceId);
            
            foreach ($content as $item) {
                $this->newLine();
                $this->info("Content: {$item->title} (ID: {$item->id})");
                
                $action = $this->choice(
                    'How would you like to resolve this?',
                    [
                        'advance' => 'Advance to next level',
                        'approve' => 'Mark as approved',
                        'reject' => 'Reject and return to creator',
                        'skip' => 'Skip this item'
                    ],
                    'skip'
                );

                try {
                    switch ($action) {
                        case 'advance':
                            $reassignmentService->advanceContentPastRemovedLevel(
                                $workspace,
                                $item->current_approval_level
                            );
                            $this->info('✓ Advanced to next level');
                            $resolved++;
                            break;

                        case 'approve':
                            $item->status = Publication::STATUS_APPROVED;
                            $item->approved_at = now();
                            $item->save();
                            $this->info('✓ Marked as approved');
                            $resolved++;
                            break;

                        case 'reject':
                            $reason = $this->ask('Rejection reason', 'Stuck in approval workflow - manually resolved');
                            $item->status = Publication::STATUS_REJECTED;
                            $item->current_approval_level = 0;
                            $item->save();
                            $this->info('✓ Rejected');
                            $resolved++;
                            break;

                        case 'skip':
                            $this->comment('Skipped');
                            break;
                    }
                } catch (\Exception $e) {
                    $this->error("Failed to resolve: {$e->getMessage()}");
                }
            }
        }

        return $resolved;
    }
}
