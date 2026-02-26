<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Models\Publications\Publication;
use App\Models\Logs\ApprovalLog;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ClientPortalController extends Controller
{
  use ApiResponse;

  /**
   * Render the client portal page.
   */
  public function renderPortal($token)
  {
    $publication = Publication::withoutGlobalScopes()
      ->where('portal_token', $token)
      ->with(['mediaFiles', 'user:id,name', 'workspace:id,name'])
      ->firstOrFail();

    return Inertia::render('Portal/ClientPortal', [
      'publication' => $publication,
      'token' => $token,
    ]);
  }

  /**
   * Show publication details for the client portal.
   */
  public function show($token)
  {
    $publication = Publication::where('portal_token', $token)
      ->with(['mediaFiles', 'user:id,name', 'workspace:id,name'])
      ->first();

    if (!$publication) {
      return $this->errorResponse('Invalid or expired portal link.', 404);
    }

    return $this->successResponse([
      'publication' => $publication,
    ]);
  }

  /**
   * Approve publication via portal.
   */
  public function approve(Request $request, $token)
  {
    $publication = Publication::where('portal_token', $token)->first();

    if (!$publication) {
      return $this->errorResponse('Invalid or expired portal link.', 404);
    }

    if ($publication->status !== 'pending_review') {
      return $this->errorResponse('This publication is not pending review.', 400);
    }

    DB::beginTransaction();
    try {
      $publication->update([
        'status' => 'approved',
        'approved_at' => now(),
      ]);

      // Create approval log
      ApprovalLog::create([
        'publication_id' => $publication->id,
        'action' => 'approved',
        'requested_at' => $publication->updated_at,
        'reviewed_at' => now(),
        // 'reviewer_id' is null for external client portal
        'notes' => 'Approved via Client Portal',
      ]);

      $publication->logActivity('approved', 'Approved via Client Portal');

      DB::commit();

      return $this->successResponse(['message' => 'Publication approved successfully.']);
    } catch (\Exception $e) {
      DB::rollBack();
      return $this->errorResponse('Failed to approve publication: ' . $e->getMessage(), 500);
    }
  }

  /**
   * Reject publication via portal.
   */
  public function reject(Request $request, $token)
  {
    $request->validate([
      'reason' => 'nullable|string|max:1000',
    ]);

    $publication = Publication::where('portal_token', $token)->first();

    if (!$publication) {
      return $this->errorResponse('Invalid or expired portal link.', 404);
    }

    if ($publication->status !== 'pending_review') {
      return $this->errorResponse('This publication is not pending review.', 400);
    }

    DB::beginTransaction();
    try {
      $publication->update([
        'status' => 'rejected',
        'rejected_at' => now(),
        'rejection_reason' => $request->reason,
      ]);

      // Create rejection log
      ApprovalLog::create([
        'publication_id' => $publication->id,
        'action' => 'rejected',
        'requested_at' => $publication->updated_at,
        'reviewed_at' => now(),
        'notes' => $request->reason,
      ]);

      $publication->logActivity('rejected', 'Rejected via Client Portal: ' . $request->reason);

      DB::commit();

      return $this->successResponse(['message' => 'Publication rejected successfully.']);
    } catch (\Exception $e) {
      DB::rollBack();
      return $this->errorResponse('Failed to reject publication: ' . $e->getMessage(), 500);
    }
  }

  /**
   * Generate or get portal token for a publication.
   * Use this from the main dashboard to get the link.
   */
  public function generateToken(Request $request, $id)
  {
    $publication = Publication::findOrFail($id);

    // Check if user has permission to share (optional, but good practice)
    // For now, let's assume any workspace member can generate this link

    if (!$publication->portal_token) {
      $publication->update([
        'portal_token' => Str::random(64)
      ]);
    }

    $portalUrl = url("/portal/{$publication->portal_token}");

    return $this->successResponse([
      'portal_token' => $publication->portal_token,
      'portal_url' => $portalUrl
    ]);
  }
}
