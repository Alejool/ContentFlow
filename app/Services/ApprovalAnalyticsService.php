<?php

namespace App\Services;

use App\Models\Workspace\Workspace;
use App\Models\Publications\Publication;
use App\Models\ApprovalAction;
use App\Models\ApprovalLevel;
use App\Models\ApprovalWorkflow;
use App\Models\Role\Role;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ApprovalAnalyticsService
{
    /**
     * Get average approval time per level
     * 
     * @param Workspace $workspace The workspace to analyze
     * @return array Array of level => average time in seconds
     */
    public function getAverageApprovalTime(Workspace $workspace): array
    {
        $workflow = ApprovalWorkflow::where('workspace_id', $workspace->id)->first();

        if (!$workflow || !$workflow->is_active) {
            return [];
        }

        // Optimized: Use a single query with proper joins and window functions
        $approvalTimes = DB::table('approval_actions as aa1')
            ->join('publications as p', 'aa1.content_id', '=', 'p.id')
            ->where('p.workspace_id', $workspace->id)
            ->where('aa1.action_type', ApprovalAction::ACTION_APPROVED)
            ->whereNotNull('aa1.approval_level')
            ->select('aa1.approval_level')
            ->selectRaw('AVG(
                EXTRACT(EPOCH FROM (aa1.created_at - (
                    SELECT created_at 
                    FROM approval_actions aa2 
                    WHERE aa2.content_id = aa1.content_id 
                    AND (
                        (aa2.action_type = ? AND aa2.approval_level = aa1.approval_level - 1)
                        OR (aa2.action_type = ? AND aa1.approval_level = 1)
                    )
                    ORDER BY aa2.created_at DESC 
                    LIMIT 1
                )))
            ) as avg_time', [ApprovalAction::ACTION_APPROVED, ApprovalAction::ACTION_SUBMITTED])
            ->groupBy('aa1.approval_level')
            ->get();

        $result = [];
        foreach ($approvalTimes as $time) {
            $result[$time->approval_level] = round($time->avg_time ?? 0);
        }

        return $result;
    }

    /**
     * Get approval/rejection rates per role
     * 
     * @param Workspace $workspace The workspace to analyze
     * @return array Array with role statistics
     */
    public function getApprovalRatesByRole(Workspace $workspace): array
    {
        // Get all approval actions with user roles
        $actions = DB::table('approval_actions as aa')
            ->join('publications as p', 'aa.content_id', '=', 'p.id')
            ->join('users as u', 'aa.user_id', '=', 'u.id')
            ->join('role_user as ru', function ($join) use ($workspace) {
                $join->on('u.id', '=', 'ru.user_id')
                    ->where('ru.workspace_id', '=', $workspace->id);
            })
            ->join('roles as r', 'ru.role_id', '=', 'r.id')
            ->where('p.workspace_id', $workspace->id)
            ->whereIn('aa.action_type', [ApprovalAction::ACTION_APPROVED, ApprovalAction::ACTION_REJECTED])
            ->select('r.name as role_name', 'r.display_name', 'aa.action_type')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('r.name', 'r.display_name', 'aa.action_type')
            ->get();

        $result = [];
        foreach ($actions as $action) {
            if (!isset($result[$action->role_name])) {
                $result[$action->role_name] = [
                    'role' => $action->role_name,
                    'display_name' => $action->display_name,
                    'total_actions' => 0,
                    'approvals' => 0,
                    'rejections' => 0,
                    'approval_rate' => 0,
                    'rejection_rate' => 0,
                ];
            }

            $result[$action->role_name]['total_actions'] += $action->count;

            if ($action->action_type === ApprovalAction::ACTION_APPROVED) {
                $result[$action->role_name]['approvals'] = $action->count;
            } elseif ($action->action_type === ApprovalAction::ACTION_REJECTED) {
                $result[$action->role_name]['rejections'] = $action->count;
            }
        }

        // Calculate rates
        foreach ($result as $role => &$stats) {
            if ($stats['total_actions'] > 0) {
                $stats['approval_rate'] = round(($stats['approvals'] / $stats['total_actions']) * 100, 2);
                $stats['rejection_rate'] = round(($stats['rejections'] / $stats['total_actions']) * 100, 2);
            }
        }

        return array_values($result);
    }

    /**
     * Get content pending at each level
     * 
     * @param Workspace $workspace The workspace to analyze
     * @return array Array of level => count
     */
    public function getPendingContentByLevel(Workspace $workspace): array
    {
        $pendingContent = Publication::where('workspace_id', $workspace->id)
            ->where('status', Publication::STATUS_PENDING_REVIEW)
            ->select('current_approval_level')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('current_approval_level')
            ->get();

        $result = [];
        foreach ($pendingContent as $item) {
            $level = $item->current_approval_level ?? 0;
            $result[$level] = $item->count;
        }

        return $result;
    }

    /**
     * Get content pending for more than specified days
     * 
     * @param Workspace $workspace The workspace to analyze
     * @param int $days Number of days threshold (default: 7)
     * @return Collection Collection of content with submission details
     */
    public function getStalePendingContent(Workspace $workspace, int $days = 7): Collection
    {
        $thresholdDate = Carbon::now()->subDays($days);

        // Optimized: Eager load only necessary relationships and fields
        return Publication::where('workspace_id', $workspace->id)
            ->where('status', Publication::STATUS_PENDING_REVIEW)
            ->where('submitted_for_approval_at', '<=', $thresholdDate)
            ->with(['user:id,name'])
            ->select('id', 'title', 'status', 'current_approval_level', 'submitted_for_approval_at', 'user_id', 'workspace_id')
            ->orderBy('submitted_for_approval_at', 'asc')
            ->get()
            ->map(function ($content) {
                return [
                    'id' => $content->id,
                    'title' => $content->title,
                    'status' => $content->status,
                    'current_approval_level' => $content->current_approval_level,
                    'submitted_at' => $content->submitted_for_approval_at,
                    'days_pending' => Carbon::parse($content->submitted_for_approval_at)->diffInDays(Carbon::now()),
                    'submitted_by' => $content->user ? $content->user->name : null,
                ];
            });
    }

    /**
     * Get approvers with most pending tasks
     * 
     * @param Workspace $workspace The workspace to analyze
     * @return array Array ranked by workload
     */
    public function getApproverWorkload(Workspace $workspace): array
    {
        $workflow = ApprovalWorkflow::where('workspace_id', $workspace->id)->first();

        if (!$workflow || !$workflow->is_active) {
            return [];
        }

        // Optimized: Get pending content grouped by required approval level in a single query
        $pendingByLevel = Publication::where('workspace_id', $workspace->id)
            ->where('status', Publication::STATUS_PENDING_REVIEW)
            ->select('current_approval_level')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('current_approval_level')
            ->get()
            ->keyBy('current_approval_level');

        if ($pendingByLevel->isEmpty()) {
            return [];
        }

        $workload = [];

        if ($workflow->is_multi_level) {
            // Optimized: Eager load role relationship and get users in a single query
            $levels = ApprovalLevel::where('approval_workflow_id', $workflow->id)
                ->with('role:id,display_name')
                ->get();

            foreach ($levels as $level) {
                $pendingCount = $pendingByLevel->get($level->level_number)?->count ?? 0;

                if ($pendingCount > 0) {
                    // Optimized: Use a single join query to get users with this role
                    $users = DB::table('role_user as ru')
                        ->join('users as u', 'ru.user_id', '=', 'u.id')
                        ->where('ru.workspace_id', $workspace->id)
                        ->where('ru.role_id', $level->role_id)
                        ->select('u.id', 'u.name', 'u.email')
                        ->get();

                    $userCount = $users->count();
                    $itemsPerUser = $userCount > 0 ? round($pendingCount / $userCount, 2) : $pendingCount;

                    foreach ($users as $user) {
                        $workload[] = [
                            'user_id' => $user->id,
                            'user_name' => $user->name,
                            'user_email' => $user->email,
                            'role' => $level->role->display_name,
                            'level' => $level->level_number,
                            'pending_items' => $itemsPerUser,
                        ];
                    }
                }
            }
        } else {
            // Optimized: Use a single query with proper joins for simple workflow
            $pendingCount = $pendingByLevel->sum('count');

            if ($pendingCount > 0) {
                $users = DB::table('role_user as ru')
                    ->join('users as u', 'ru.user_id', '=', 'u.id')
                    ->join('roles as r', 'ru.role_id', '=', 'r.id')
                    ->join('role_permission as rp', 'r.id', '=', 'rp.role_id')
                    ->join('permissions as p', 'rp.permission_id', '=', 'p.id')
                    ->where('ru.workspace_id', $workspace->id)
                    ->where('p.name', 'publish_content')
                    ->select('u.id', 'u.name', 'u.email', 'r.display_name as role')
                    ->distinct()
                    ->get();

                $userCount = $users->count();
                $itemsPerUser = $userCount > 0 ? round($pendingCount / $userCount, 2) : $pendingCount;

                foreach ($users as $user) {
                    $workload[] = [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'user_email' => $user->email,
                        'role' => $user->role,
                        'level' => 0,
                        'pending_items' => $itemsPerUser,
                    ];
                }
            }
        }

        // Sort by pending items descending
        usort($workload, function ($a, $b) {
            return $b['pending_items'] <=> $a['pending_items'];
        });

        return $workload;
    }

    /**
     * Get average time from submission to publication
     * 
     * @param Workspace $workspace The workspace to analyze
     * @return float Average time in seconds
     */
    public function getAveragePublicationTime(Workspace $workspace): float
    {
        $avgTime = Publication::where('workspace_id', $workspace->id)
            ->where('status', Publication::STATUS_PUBLISHED)
            ->whereNotNull('submitted_for_approval_at')
            ->whereNotNull('published_at')
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (published_at - submitted_for_approval_at))) as avg_time')
            ->value('avg_time');

        return round($avgTime ?? 0, 2);
    }

    /**
     * Export analytics data
     * 
     * @param Workspace $workspace The workspace to export analytics for
     * @param string $format Format: 'csv' or 'json'
     * @return string Formatted string for download
     */
    public function exportAnalytics(Workspace $workspace, string $format = 'json'): string
    {
        // Gather all analytics data
        $analytics = [
            'workspace_id' => $workspace->id,
            'workspace_name' => $workspace->name,
            'generated_at' => Carbon::now()->toIso8601String(),
            'average_approval_time_by_level' => $this->getAverageApprovalTime($workspace),
            'approval_rates_by_role' => $this->getApprovalRatesByRole($workspace),
            'pending_content_by_level' => $this->getPendingContentByLevel($workspace),
            'stale_pending_content' => $this->getStalePendingContent($workspace)->toArray(),
            'approver_workload' => $this->getApproverWorkload($workspace),
            'average_publication_time_seconds' => $this->getAveragePublicationTime($workspace),
        ];

        if ($format === 'csv') {
            return $this->formatAsCsv($analytics);
        }

        return json_encode($analytics, JSON_PRETTY_PRINT);
    }

    /**
     * Format analytics data as CSV
     * 
     * @param array $analytics The analytics data
     * @return string CSV formatted string
     */
    private function formatAsCsv(array $analytics): string
    {
        $csv = [];

        // Header
        $csv[] = "Approval Workflow Analytics Report";
        $csv[] = "Workspace: {$analytics['workspace_name']}";
        $csv[] = "Generated: {$analytics['generated_at']}";
        $csv[] = "";

        // Average Approval Time by Level
        $csv[] = "Average Approval Time by Level (seconds)";
        $csv[] = "Level,Average Time";
        foreach ($analytics['average_approval_time_by_level'] as $level => $time) {
            $csv[] = "{$level},{$time}";
        }
        $csv[] = "";

        // Approval Rates by Role
        $csv[] = "Approval Rates by Role";
        $csv[] = "Role,Display Name,Total Actions,Approvals,Rejections,Approval Rate %,Rejection Rate %";
        foreach ($analytics['approval_rates_by_role'] as $roleStats) {
            $csv[] = implode(',', [
                $roleStats['role'],
                $roleStats['display_name'],
                $roleStats['total_actions'],
                $roleStats['approvals'],
                $roleStats['rejections'],
                $roleStats['approval_rate'],
                $roleStats['rejection_rate'],
            ]);
        }
        $csv[] = "";

        // Pending Content by Level
        $csv[] = "Pending Content by Level";
        $csv[] = "Level,Count";
        foreach ($analytics['pending_content_by_level'] as $level => $count) {
            $csv[] = "{$level},{$count}";
        }
        $csv[] = "";

        // Stale Pending Content
        $csv[] = "Stale Pending Content (>7 days)";
        $csv[] = "ID,Title,Status,Level,Submitted At,Days Pending,Submitted By";
        foreach ($analytics['stale_pending_content'] as $content) {
            $csv[] = implode(',', [
                $content['id'],
                '"' . str_replace('"', '""', $content['title']) . '"',
                $content['status'],
                $content['current_approval_level'],
                $content['submitted_at'],
                $content['days_pending'],
                '"' . str_replace('"', '""', $content['submitted_by'] ?? 'N/A') . '"',
            ]);
        }
        $csv[] = "";

        // Approver Workload
        $csv[] = "Approver Workload";
        $csv[] = "User ID,User Name,Email,Role,Level,Pending Items";
        foreach ($analytics['approver_workload'] as $workload) {
            $csv[] = implode(',', [
                $workload['user_id'],
                '"' . str_replace('"', '""', $workload['user_name']) . '"',
                $workload['user_email'],
                '"' . str_replace('"', '""', $workload['role']) . '"',
                $workload['level'],
                $workload['pending_items'],
            ]);
        }
        $csv[] = "";

        // Average Publication Time
        $csv[] = "Average Publication Time";
        $csv[] = "Metric,Value (seconds)";
        $csv[] = "Average Time from Submission to Publication,{$analytics['average_publication_time_seconds']}";

        return implode("\n", $csv);
    }
}
