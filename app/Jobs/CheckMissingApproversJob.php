<?php

namespace App\Jobs;

use App\Models\ApprovalWorkflow;
use App\Models\ApprovalLevel;
use App\Models\Workspace\Workspace;
use App\Models\User;
use App\Models\Role\Role;
use App\Notifications\MissingApproversNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckMissingApproversJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Starting missing approvers check');

        // Get all enabled workflows
        $workflows = ApprovalWorkflow::where('is_enabled', true)
            ->where('is_multi_level', true)
            ->with(['workspace', 'levels.role'])
            ->get();

        foreach ($workflows as $workflow) {
            $this->checkWorkflowApprovers($workflow);
        }

        Log::info('Completed missing approvers check');
    }

    /**
     * Check if a workflow has missing approvers
     * 
     * @param ApprovalWorkflow $workflow
     * @return void
     */
    private function checkWorkflowApprovers(ApprovalWorkflow $workflow): void
    {
        $workspace = $workflow->workspace;
        $missingLevels = [];

        foreach ($workflow->levels as $level) {
            // Check if any users have this role in the workspace
            $approverCount = DB::table('role_user')
                ->where('workspace_id', $workspace->id)
                ->where('role_id', $level->role_id)
                ->count();

            if ($approverCount === 0) {
                $missingLevels[] = [
                    'level_number' => $level->level_number,
                    'level_name' => $level->level_name,
                    'role_name' => $level->role->display_name,
                ];

                Log::warning('Missing approvers detected', [
                    'workspace_id' => $workspace->id,
                    'workspace_name' => $workspace->name,
                    'level_number' => $level->level_number,
                    'level_name' => $level->level_name,
                    'role_name' => $level->role->name,
                ]);
            }
        }

        // If missing levels found, notify admins
        if (!empty($missingLevels)) {
            $this->notifyAdmins($workspace, $missingLevels);
        }
    }

    /**
     * Notify all admins in the workspace about missing approvers
     * 
     * @param Workspace $workspace
     * @param array $missingLevels
     * @return void
     */
    private function notifyAdmins(Workspace $workspace, array $missingLevels): void
    {
        // Get all admins in the workspace
        $adminRole = Role::where('name', Role::ADMIN)->first();
        $ownerRole = Role::where('name', Role::OWNER)->first();

        if (!$adminRole || !$ownerRole) {
            Log::error('Admin or Owner role not found');
            return;
        }

        $admins = User::select('users.*')
            ->join('role_user', 'users.id', '=', 'role_user.user_id')
            ->where('role_user.workspace_id', $workspace->id)
            ->whereIn('role_user.role_id', [$adminRole->id, $ownerRole->id])
            ->distinct()
            ->get();

        foreach ($admins as $admin) {
            try {
                $admin->notify(new MissingApproversNotification($workspace, $missingLevels));
                
                Log::info('Notified admin about missing approvers', [
                    'admin_id' => $admin->id,
                    'workspace_id' => $workspace->id,
                    'missing_levels_count' => count($missingLevels),
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to notify admin about missing approvers', [
                    'admin_id' => $admin->id,
                    'workspace_id' => $workspace->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
