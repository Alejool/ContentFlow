<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Models\ApprovalLog;
use App\Models\Publications\Publication;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ApprovalController extends Controller
{
  use ApiResponse;

  /**
   * Get list of pending approval requests
   */
  public function index(Request $request)
  {
    $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

    if (!$workspaceId) {
      return $this->errorResponse('No active workspace found.', 404);
    }

    // Only users with 'approve' permission can access this
    if (!Auth::user()->hasPermission('approve', $workspaceId)) {
      return $this->errorResponse('You do not have permission to view approvals.', 403);
    }

    $query = Publication::where('workspace_id', $workspaceId)
      ->where('status', 'pending_review')
      ->with([
        'user:id,name,email,photo_url',
        'mediaFiles:media_files.id,media_files.file_path,media_files.file_type',
        'approvalLogs' => fn($q) => $q->latest('requested_at')->limit(1)->with('requester:id,name,photo_url')
      ])
      ->orderBy('updated_at', 'desc');

    $publications = $query->paginate($request->query('per_page', 10));

    return $this->successResponse(['publications' => $publications]);
  }

  /**
   * Get approval history with filters
   */
  public function history(Request $request)
  {
    \Illuminate\Support\Facades\Log::info('ENTERED ApprovalController::history', [
      'user_id' => Auth::id(),
      'query' => $request->all()
    ]);
    try {
      $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

      if (!$workspaceId) {
        return $this->errorResponse('No active workspace found.', 404);
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
        ->orderBy('requested_at', 'desc');

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
      \Illuminate\Support\Facades\Log::error('Approval History Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
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
      return $this->errorResponse('No active workspace found.', 404);
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
