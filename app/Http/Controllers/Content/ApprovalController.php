<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Models\Logs\ApprovalLog;
use App\Models\Publications\Publication;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ApprovalController extends Controller
{
  use ApiResponse;

  /**
   * Check if current user can approve content in the workspace
   * Considers both basic permission and multi-level workflow assignments
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
      // Get user's role in workspace
      $userRole = DB::table('role_user')
        ->where('workspace_id', $workspaceId)
        ->where('user_id', $userId)
        ->first();

      if ($userRole) {
        // Check if user's role or user_id is in any active workflow step
        $hasWorkflowAssignment = DB::table('approval_steps')
          ->join('approval_workflows', 'approval_steps.workflow_id', '=', 'approval_workflows.id')
          ->where('approval_workflows.workspace_id', $workspaceId)
          ->where('approval_workflows.is_active', true)
          ->where(function ($q) use ($userId, $userRole) {
            $q->where('approval_steps.user_id', $userId)
              ->orWhere('approval_steps.role_id', $userRole->role_id);
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
   * Get list of pending approval requests
   * Now filters by what the user can actually approve
   */
  public function index(Request $request)
  {
    $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

    if (!$workspaceId) {
      return $this->errorResponse('No active workspace found.', 404);
    }

    $userId = Auth::id();
    $hasAdminPermission = Auth::user()->hasPermission('approve', $workspaceId);

    // Get user's role in workspace
    $userRole = DB::table('role_user')
      ->where('workspace_id', $workspaceId)
      ->where('user_id', $userId)
      ->first();

    $query = Publication::where('workspace_id', $workspaceId)
      ->where('status', 'pending_review')
      ->with([
        'user:id,name,email,photo_url',
        'mediaFiles:media_files.id,media_files.file_path,media_files.file_type',
        'approvalLogs' => fn($q) => $q->latest('requested_at')->limit(1)->with('requester:id,name,photo_url'),
        'currentApprovalStep.workflow'
      ])
      ->orderBy('updated_at', 'desc');

    // If user doesn't have admin permission, filter by workflow assignments
    if (!$hasAdminPermission && $userRole) {
      $query->whereHas('currentApprovalStep', function ($q) use ($userId, $userRole) {
        $q->where(function ($subQ) use ($userId, $userRole) {
          $subQ->where('user_id', $userId)
            ->orWhere('role_id', $userRole->role_id)
            ->orWhereNull('user_id')->whereNull('role_id'); // Any user can approve
        });
      });
    } elseif (!$hasAdminPermission) {
      // User has no permission and no role, return empty
      return $this->successResponse(['publications' => []]);
    }

    $publications = $query->paginate($request->query('per_page', 10));

    return $this->successResponse(['publications' => $publications]);
  }

  /**
   * Get approval history with filters
   */
  public function history(Request $request)
  {
    try {
      $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

      if (!$workspaceId) {
        return $this->errorResponse('No active workspace found.', 400);
      }

      // Only users with 'approve' permission can access this
      if (!Auth::user()->hasPermission('approve', $workspaceId)) {
        return $this->errorResponse('You do not have permission to view approval history.', 403);
      }

      $query = ApprovalLog::whereHas('publication', function ($q) use ($workspaceId) {
        $q->where('workspace_id', $workspaceId);
      })
        ->with([
          'publication:id,title,status',
          'requester:id,name,email,photo_url',
          'reviewer:id,name,email,photo_url'
        ])
        ->whereNotNull('action')
        ->whereNotNull('reviewed_at')
        ->orderBy('reviewed_at', 'desc');

      // Filter by action (approved/rejected)
      if ($request->has('action') && in_array($request->action, ['approved', 'rejected'])) {
        $query->where('action', $request->action);
      }

      // Filter by date range
      if ($request->has('date_start') && $request->has('date_end')) {
        $query->whereBetween('requested_at', [$request->date_start, $request->date_end]);
      }

      // Search by publication title
      if ($request->has('search') && $request->search) {
        $query->whereHas('publication', function ($q) use ($request) {
          $q->where('title', 'ILIKE', '%' . $request->search . '%');
        });
      }

      // Filter by specific publication ID (for details view)
      if ($request->has('publication_id')) {
        $query->where('publication_id', $request->publication_id);
      }

      $logs = $query->paginate($request->query('per_page', 10));

      return $this->successResponse(['logs' => $logs]);
    } catch (\Throwable $e) {
      return $this->errorResponse('Server Error: ' . $e->getMessage(), 500);
    }
  }

  /**
   * Get approval statistics
   */
  public function stats()
  {
    $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

    if (!$workspaceId) {
      return $this->errorResponse('No active workspace found.', 400);
    }

    // Only users with 'approve' permission can access this
    if (!Auth::user()->hasPermission('approve', $workspaceId)) {
      return $this->errorResponse('You do not have permission to view approval statistics.', 403);
    }

    // Total pending requests
    $pendingRequests = Publication::where('workspace_id', $workspaceId)
      ->where('status', 'pending_review')
      ->count();

    // Approved today
    $approvedToday = ApprovalLog::whereHas('publication', function ($q) use ($workspaceId) {
      $q->where('workspace_id', $workspaceId);
    })
      ->where('action', 'approved')
      ->whereDate('reviewed_at', today())
      ->count();

    // Rejected today
    $rejectedToday = ApprovalLog::whereHas('publication', function ($q) use ($workspaceId) {
      $q->where('workspace_id', $workspaceId);
    })
      ->where('action', 'rejected')
      ->whereDate('reviewed_at', today())
      ->count();

    // Average approval time (in hours)
    $avgApprovalTime = ApprovalLog::whereHas('publication', function ($q) use ($workspaceId) {
      $q->where('workspace_id', $workspaceId);
    })
      ->whereNotNull('reviewed_at')
      ->where('action', 'approved')
      ->selectRaw('AVG(EXTRACT(EPOCH FROM (reviewed_at - requested_at)) / 3600) as avg_hours')
      ->value('avg_hours');

    return $this->successResponse([
      'pending_requests' => $pendingRequests,
      'approved_today' => $approvedToday,
      'rejected_today' => $rejectedToday,
      'avg_approval_time_hours' => round($avgApprovalTime ?? 0, 2),
    ]);
  }
}
