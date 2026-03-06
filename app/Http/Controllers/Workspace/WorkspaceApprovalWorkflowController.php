<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalStep;
use App\Models\Workspace\Workspace;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
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

  public function index(Request $request, $idOrSlug)
  {
    try {
      $workspace = $this->getWorkspace($idOrSlug);

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

    $request->validate([
      'name' => 'required|string|max:255',
      'steps' => 'required|array|min:1',
      'steps.*.role_id' => 'nullable|exists:roles,id',
      'steps.*.user_id' => 'nullable|exists:users,id',
      'steps.*.name' => 'nullable|string|max:255',
    ]);

    return DB::transaction(function () use ($request, $workspace) {
      $workflow = ApprovalWorkflow::create([
        'workspace_id' => $workspace->id,
        'name' => $request->name,
        'is_active' => $request->is_active ?? true,
      ]);

      foreach ($request->steps as $index => $stepData) {
        ApprovalStep::create([
          'workflow_id' => $workflow->id,
          'role_id' => $stepData['role_id'] ?? null,
          'user_id' => $stepData['user_id'] ?? null,
          'name' => $stepData['name'] ?? null,
          'step_order' => $index + 1,
        ]);
      }

      return $this->successResponse($workflow->load('steps'), 'Workflow created successfully', 201);
    });
  }

  public function update(Request $request, $idOrSlug, ApprovalWorkflow $workflow)
  {
    $workspace = $this->getWorkspace($idOrSlug);

    if ($workflow->workspace_id !== $workspace->id) {
      return $this->errorResponse('Unauthorized', 403);
    }

    $request->validate([
      'name' => 'sometimes|string|max:255',
      'steps' => 'sometimes|array|min:1',
      'is_active' => 'sometimes|boolean',
    ]);

    return DB::transaction(function () use ($request, $workflow) {
      if ($request->has('name')) {
        $workflow->update(['name' => $request->name]);
      }

      if ($request->has('is_active')) {
        $workflow->update(['is_active' => $request->is_active]);
      }

      if ($request->has('steps')) {
        // Simplest way: recreate steps
        $workflow->steps()->delete();
        foreach ($request->steps as $index => $stepData) {
          ApprovalStep::create([
            'workflow_id' => $workflow->id,
            'role_id' => $stepData['role_id'] ?? null,
            'user_id' => $stepData['user_id'] ?? null,
            'name' => $stepData['name'] ?? null,
            'step_order' => $index + 1,
          ]);
        }
      }

      return $this->successResponse(['workflow' => $workflow->load('steps')], 'Workflow updated successfully');
    });
  }

  public function destroy($idOrSlug, ApprovalWorkflow $workflow)
  {
    $workspace = $this->getWorkspace($idOrSlug);

    if ($workflow->workspace_id !== $workspace->id) {
      return $this->errorResponse('Unauthorized', 403);
    }

    $workflow->delete();

    return $this->successResponse(null, 'Workflow deleted successfully');
  }
}
