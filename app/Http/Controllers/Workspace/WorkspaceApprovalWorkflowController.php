<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalLevel;
use App\Models\Approval\ApprovalRequest;
use App\Models\Logs\ApprovalLog;
use App\Models\Workspace\Workspace;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class WorkspaceApprovalWorkflowController extends Controller
{
  use ApiResponse;

  protected function getWorkspace($idOrSlug)
  {
    return Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();
  }

  protected function checkFeature(Workspace $workspace)
  {
    $plan = $workspace->subscription?->plan ?? 'free';
    $feature = config("plans.{$plan}.features.approval_workflows", false);

    if (!$feature) {
      abort(403, 'This feature is not available for your plan.');
    }
  }

  public function index(Request $request, $idOrSlug)
  {
    try {
      $workspace = $this->getWorkspace($idOrSlug);
      $this->checkFeature($workspace);

      $workflows = ApprovalWorkflow::where('workspace_id', $workspace->id)
        ->with(['steps.role', 'steps.user'])
        ->get();

      return $this->successResponse($workflows->toArray());
    } catch (\Exception $e) {
      return $this->errorResponse($e->getMessage(), 500);
    }
  }

  public function store(Request $request, $idOrSlug)
  {
    $workspace = $this->getWorkspace($idOrSlug);
    $this->checkFeature($workspace);

    $request->validate([
      'name' => 'required|string|max:255',
      'is_multi_level' => 'sometimes|boolean',
      'steps' => 'required|array|min:1',
      'steps.*.role_id' => 'nullable|exists:roles,id',
      'steps.*.user_id' => 'nullable|exists:users,id',
      'steps.*.name' => 'nullable|string|max:255',
    ]);

    // Enforce tiered limits
    $plan = $workspace->subscription?->plan ?? 'free';
    $hasAdvanced = config("plans.{$plan}.features.approval_workflows") === 'advanced';
    if (!$hasAdvanced && count($request->steps) > 1) {
      return $this->errorResponse('Your current plan only allows single-level approvals. Please upgrade to Enterprise for multi-level workflows.', 403);
    }

    return DB::transaction(function () use ($request, $workspace) {
      // Get or create workflow (since workspace can only have one workflow)
      $workflow = ApprovalWorkflow::firstOrCreate(
        ['workspace_id' => $workspace->id],
        [
          'name' => $request->name,
          'is_enabled' => $request->is_enabled ?? true,
          'is_active' => true, // Keep for backward compatibility
          'is_multi_level' => count($request->steps) > 1,
        ]
      );

      // If workflow already existed, update it
      if (!$workflow->wasRecentlyCreated) {
        $workflow->update([
          'name' => $request->name,
          'is_enabled' => $request->is_enabled ?? true,
          'is_active' => true, // Keep for backward compatibility
          'is_multi_level' => count($request->steps) > 1,
        ]);
        
        // Clear existing steps to replace them
        $workflow->steps()->delete();
      }

      foreach ($request->steps as $index => $stepData) {
        ApprovalLevel::create([
          'approval_workflow_id' => $workflow->id,
          'role_id' => $stepData['role_id'] ?? null,
          'user_id' => $stepData['user_id'] ?? null,
          'level_name' => $stepData['name'] ?? "Nivel " . ($index + 1),
          'level_number' => $index + 1,
        ]);
      }

      $message = $workflow->wasRecentlyCreated ? 'Workflow created successfully' : 'Workflow updated successfully';
      return $this->successResponse($workflow->load('steps.role', 'steps.user'), $message, 201);
    });
  }

  public function update(Request $request, $idOrSlug, ApprovalWorkflow $workflow)
  {
    $workspace = $this->getWorkspace($idOrSlug);
    $this->checkFeature($workspace);

    if ($workflow->workspace_id !== $workspace->id) {
      return $this->errorResponse('Unauthorized', 403);
    }

    $request->validate([
      'name' => 'sometimes|string|max:255',
      'is_multi_level' => 'sometimes|boolean',
      'steps' => 'sometimes|array|min:1',
      'steps.*.role_id' => 'nullable|exists:roles,id',
      'steps.*.user_id' => 'nullable|exists:users,id',
      'steps.*.name' => 'nullable|string|max:255',
      'is_enabled' => 'sometimes|boolean',
      'is_active' => 'sometimes|boolean', // Keep for backward compatibility
    ]);

    // Enforce tiered limits
    if ($request->has('steps')) {
      $plan = $workspace->subscription?->plan ?? 'free';
      $hasAdvanced = config("plans.{$plan}.features.approval_workflows") === 'advanced';
      if (!$hasAdvanced && count($request->steps) > 1) {
        return $this->errorResponse('Your current plan only allows single-level approvals. Please upgrade to Enterprise for multi-level workflows.', 403);
      }
    }

    return DB::transaction(function () use ($request, $workflow) {
      if ($request->has('name')) {
        $workflow->update(['name' => $request->name]);
      }

      if ($request->has('is_enabled')) {
        $workflow->update(['is_enabled' => $request->is_enabled]);
      }
      
      if ($request->has('is_active')) {
        $workflow->update(['is_active' => $request->is_active]);
      }

      if ($request->has('steps')) {
        // Update is_multi_level based on steps count
        $workflow->update(['is_multi_level' => count($request->steps) > 1]);
        $workflow->update(['is_enabled' => true]);
        
        // Simplest way: recreate steps
        $workflow->steps()->delete();
        foreach ($request->steps as $index => $stepData) {
          ApprovalLevel::create([
            'approval_workflow_id' => $workflow->id,
            'role_id' => $stepData['role_id'] ?? null,
            'user_id' => $stepData['user_id'] ?? null,
            'level_name' => $stepData['name'] ?? "Nivel " . ($index + 1),
            'level_number' => $index + 1,
          ]);
        }
      }

      return $this->successResponse(['workflow' => $workflow->load('steps.role', 'steps.user')], 'Workflow updated successfully');
    });
  }

  public function destroy($idOrSlug, ApprovalWorkflow $workflow)
  {
    $workspace = $this->getWorkspace($idOrSlug);
    $this->checkFeature($workspace);

    if ($workflow->workspace_id !== $workspace->id) {
      return $this->errorResponse('Unauthorized', 403);
    }

    DB::transaction(function () use ($workflow) {
      // 1. Cancel pending requests and revert their publications to draft
      $pendingRequests = ApprovalRequest::where('workflow_id', $workflow->id)
        ->where('status', ApprovalRequest::STATUS_PENDING)
        ->with('publication')
        ->get();

      foreach ($pendingRequests as $approvalRequest) {
        ApprovalLog::create([
          'approval_request_id' => $approvalRequest->id,
          'user_id'             => Auth::id(),
          'action'              => ApprovalLog::ACTION_CANCELLED,
          'comment'             => 'Flujo eliminado — revisión pendiente cancelada automáticamente.',
          'metadata'            => ['reason' => 'workflow_deleted'],
        ]);

        $approvalRequest->update([
          'status'       => ApprovalRequest::STATUS_CANCELLED,
          'completed_at' => now(),
        ]);

        if ($approvalRequest->publication) {
          $approvalRequest->publication->update([
            'status'           => 'failed',
            'rejection_reason' => 'El flujo de aprobación fue eliminado mientras la publicación estaba en revisión.',
          ]);
        }
      }

      // 2. Nullify workflow_id on ALL requests (breaks the FK before delete)
      ApprovalRequest::where('workflow_id', $workflow->id)
        ->update(['workflow_id' => null]);

      // 3. Delete levels/steps then the workflow
      $workflow->steps()->delete();
      $workflow->delete();
    });

    return $this->successResponse(null, 'Workflow deleted successfully');
  }
}
