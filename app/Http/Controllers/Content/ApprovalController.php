<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Models\Approval\ApprovalRequest;
use App\Models\Publications\Publication;
use App\Services\Approval\ApprovalWorkflowEngine;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ApprovalController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ApprovalWorkflowEngine $engine
    ) {}

    /**
     * Check if current user can approve content in the workspace
     */
    public function canApprove(Request $request)
    {
        $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

        if (!$workspaceId) {
            return $this->errorResponse('No active workspace found.', 404);
        }

        $userId = Auth::id();
        $canApprove = false;
        $reason = '';

        // Check if user has general 'approve' permission (admin/owner)
        if (Auth::user()->hasPermission('approve', $workspaceId)) {
            $canApprove = true;
            $reason = 'admin_permission';
        } else {
            // Check if user is assigned to any approval workflow step
            $userRole = DB::table('role_user')
                ->where('workspace_id', $workspaceId)
                ->where('user_id', $userId)
                ->first();

            if ($userRole) {
                // Check if user's role is in any active workflow step
                $hasWorkflowAssignment = DB::table('approval_levels')
                    ->join('approval_workflows', 'approval_levels.approval_workflow_id', '=', 'approval_workflows.id')
                    ->where('approval_workflows.workspace_id', $workspaceId)
                    ->where('approval_workflows.is_active', true)
                    ->where(function ($query) use ($userRole, $userId) {
                        $query->where('approval_levels.role_id', $userRole->role_id)
                            ->orWhere('approval_levels.user_id', $userId);
                    })
                    ->exists();

                if ($hasWorkflowAssignment) {
                    $canApprove = true;
                    $reason = 'workflow_assignment';
                }
            }
        }

        return $this->successResponse([
            'can_approve' => $canApprove,
            'reason' => $reason,
        ]);
    }

    /**
     * Get list of pending approval requests for current user
     */
    public function index(Request $request)
    {
        $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

        if (!$workspaceId) {
            return $this->errorResponse('No active workspace found.', 404);
        }

        $user = Auth::user();

        // Get pending requests for this user
        $requests = $this->engine->getPendingRequestsForUser($user, $workspaceId);

        return $this->successResponse([
            'requests' => $requests,
            'count' => $requests->count(),
        ]);
    }

    /**
     * Get approval statistics
     */
    public function stats(Request $request)
    {
        $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

        if (!$workspaceId) {
            return $this->errorResponse('No active workspace found.', 404);
        }

        $user = Auth::user();

        // Get counts
        $pendingCount = ApprovalRequest::whereHas('publication', function ($query) use ($workspaceId) {
            $query->where('workspace_id', $workspaceId);
        })
        ->where('status', ApprovalRequest::STATUS_PENDING)
        ->count();

        $myPendingCount = $this->engine->getPendingRequestsForUser($user, $workspaceId)->count();

        $approvedToday = ApprovalRequest::whereHas('publication', function ($query) use ($workspaceId) {
            $query->where('workspace_id', $workspaceId);
        })
        ->where('status', ApprovalRequest::STATUS_APPROVED)
        ->whereDate('completed_at', today())
        ->count();

        $rejectedToday = ApprovalRequest::whereHas('publication', function ($query) use ($workspaceId) {
            $query->where('workspace_id', $workspaceId);
        })
        ->where('status', ApprovalRequest::STATUS_REJECTED)
        ->whereDate('completed_at', today())
        ->count();

        // Average approval time in hours (from submitted_at to completed_at)
        $avgTimeHours = ApprovalRequest::whereHas('publication', function ($query) use ($workspaceId) {
            $query->where('workspace_id', $workspaceId);
        })
        ->where('status', ApprovalRequest::STATUS_APPROVED)
        ->whereNotNull('completed_at')
        ->selectRaw('AVG(EXTRACT(EPOCH FROM (completed_at - submitted_at)) / 3600) as avg_hours')
        ->value('avg_hours');

        return $this->successResponse([
            'pending_requests' => $pendingCount,
            'pending_total' => $pendingCount,
            'pending_for_me' => $myPendingCount,
            'approved_today' => $approvedToday,
            'rejected_today' => $rejectedToday,
            'avg_approval_time_hours' => $avgTimeHours !== null ? round($avgTimeHours, 1) : null,
        ]);
    }

    /**
     * Get approval history
     */
    public function history(Request $request)
    {
        $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

        if (!$workspaceId) {
            return $this->errorResponse('No active workspace found.', 404);
        }

        $query = ApprovalRequest::with([
            'publication',
            'workflow',
            'submitter',
            'completedBy',
            'logs.user',
            'logs.approvalStep',
        ])
        ->whereHas('publication', function ($q) use ($workspaceId) {
            $q->where('workspace_id', $workspaceId);
        });

        // Filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('publication_id')) {
            $query->where('publication_id', $request->publication_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('submitter', function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                })
                ->orWhere('rejection_reason', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 12);
        $history = $query->orderBy('submitted_at', 'desc')->paginate($perPage);

        return $this->successResponse([
            'history' => $history,
            'count' => $history->total(),
        ]);
    }
}
