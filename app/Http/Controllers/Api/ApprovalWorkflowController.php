<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApprovalWorkflow\AddLevelRequest;
use App\Http\Requests\ApprovalWorkflow\ConfigureWorkflowRequest;
use App\Http\Requests\ApprovalWorkflow\UpdateLevelRequest;
use App\Models\ApprovalLevel;
use App\Models\ApprovalWorkflow;
use App\Models\Workspace\Workspace;
use App\Services\ApprovalWorkflowService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalWorkflowController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ApprovalWorkflowService $approvalWorkflowService
    ) {}

    /**
     * Get workspace by ID or slug
     */
    protected function getWorkspace($idOrSlug): Workspace
    {
        return Workspace::where(function ($q) use ($idOrSlug) {
            if (is_numeric($idOrSlug)) {
                $q->where('id', $idOrSlug);
            }
            $q->orWhere('slug', $idOrSlug);
        })->firstOrFail();
    }

    /**
     * Enable approval workflow for a workspace
     * 
     * POST /api/workspaces/{workspace}/approval-workflow/enable
     */
    public function enable(Request $request, $idOrSlug): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);

            // Check authorization
            $this->authorize('configure', [ApprovalWorkflow::class, $workspace]);

            // Get or create workflow
            $workflow = ApprovalWorkflow::firstOrCreate(
                ['workspace_id' => $workspace->id],
                ['is_enabled' => false, 'is_multi_level' => false]
            );

            $workflow->update(['is_enabled' => true]);

            // Invalidate workflow cache
            $this->approvalWorkflowService->invalidateCache($workspace->id);

            return $this->successResponse(
                [
                    'workflow_id' => $workflow->id,
                    'is_enabled' => $workflow->is_enabled,
                    'is_multi_level' => $workflow->is_multi_level,
                ],
                'Approval workflow enabled successfully',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to enable workflow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Disable approval workflow for a workspace
     * 
     * POST /api/workspaces/{workspace}/approval-workflow/disable
     */
    public function disable(Request $request, $idOrSlug): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);

            // Check authorization
            $this->authorize('configure', [ApprovalWorkflow::class, $workspace]);

            $workflow = ApprovalWorkflow::where('workspace_id', $workspace->id)->first();

            if (!$workflow) {
                return $this->errorResponse('Approval workflow not found', 404);
            }

            $workflow->update(['is_enabled' => false]);

            // Invalidate workflow cache
            $this->approvalWorkflowService->invalidateCache($workspace->id);

            return $this->successResponse(
                [
                    'workflow_id' => $workflow->id,
                    'is_enabled' => $workflow->is_enabled,
                ],
                'Approval workflow disabled successfully',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to disable workflow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Configure multi-level approval workflow
     * 
     * PUT /api/workspaces/{workspace}/approval-workflow/configure
     */
    public function configure(ConfigureWorkflowRequest $request, $idOrSlug): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);

            // Check authorization
            $this->authorize('configure', [ApprovalWorkflow::class, $workspace]);

            // Configure workflow
            $workflow = $this->approvalWorkflowService->configureMultiLevelWorkflow(
                $workspace,
                $request->levels ?? []
            );

            // Update multi-level flag
            $workflow->update(['is_multi_level' => $request->is_multi_level]);

            // Invalidate workflow cache
            $this->approvalWorkflowService->invalidateCache($workspace->id);

            return $this->successResponse(
                [
                    'workflow_id' => $workflow->id,
                    'is_enabled' => $workflow->is_enabled,
                    'is_multi_level' => $workflow->is_multi_level,
                    'levels' => $workflow->levels()->ordered()->with('role')->get()->map(function ($level) {
                        return [
                            'id' => $level->id,
                            'level_number' => $level->level_number,
                            'level_name' => $level->level_name,
                            'role' => $level->role->name,
                        ];
                    }),
                ],
                'Workflow configured successfully',
                200
            );
        } catch (\App\Exceptions\InvalidWorkflowConfigurationException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to configure workflow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get workflow configuration
     * 
     * GET /api/workspaces/{workspace}/approval-workflow
     */
    public function show(Request $request, $idOrSlug): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);

            $workflow = ApprovalWorkflow::where('workspace_id', $workspace->id)
                ->with(['levels' => function ($query) {
                    $query->ordered()->with('role');
                }])
                ->first();

            if (!$workflow) {
                return $this->successResponse([
                    'is_enabled' => false,
                    'is_multi_level' => false,
                    'levels' => [],
                ]);
            }

            return $this->successResponse([
                'workflow_id' => $workflow->id,
                'is_enabled' => $workflow->is_enabled,
                'is_multi_level' => $workflow->is_multi_level,
                'levels' => $workflow->levels->map(function ($level) {
                    return [
                        'id' => $level->id,
                        'level_number' => $level->level_number,
                        'level_name' => $level->level_name,
                        'role' => $level->role->name,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve workflow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Add an approval level
     * 
     * POST /api/workspaces/{workspace}/approval-workflow/levels
     */
    public function addLevel(AddLevelRequest $request, $idOrSlug): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);

            // Check authorization
            $this->authorize('modifyLevels', [ApprovalWorkflow::class, $workspace]);

            $workflow = ApprovalWorkflow::where('workspace_id', $workspace->id)->firstOrFail();

            // Add level using service
            $levels = $workflow->levels()->ordered()->get()->toArray();
            $levels[] = [
                'level_number' => $request->level_number,
                'level_name' => $request->level_name,
                'role_name' => $request->role_name,
            ];

            $this->approvalWorkflowService->configureMultiLevelWorkflow($workspace, $levels);

            $workflow->refresh();

            return $this->successResponse(
                [
                    'workflow_id' => $workflow->id,
                    'levels' => $workflow->levels()->ordered()->with('role')->get()->map(function ($level) {
                        return [
                            'id' => $level->id,
                            'level_number' => $level->level_number,
                            'level_name' => $level->level_name,
                            'role' => $level->role->name,
                        ];
                    }),
                ],
                'Level added successfully',
                201
            );
        } catch (\App\Exceptions\InvalidWorkflowConfigurationException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to add level: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update an approval level
     * 
     * PUT /api/workspaces/{workspace}/approval-workflow/levels/{level}
     */
    public function updateLevel(UpdateLevelRequest $request, $idOrSlug, $levelId): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);

            // Check authorization
            $this->authorize('modifyLevels', [ApprovalWorkflow::class, $workspace]);

            $level = ApprovalLevel::findOrFail($levelId);

            // Verify level belongs to workspace
            if ($level->workflow->workspace_id !== $workspace->id) {
                return $this->errorResponse('Unauthorized', 403);
            }

            // Update level
            if ($request->has('level_name')) {
                $level->level_name = $request->level_name;
            }

            if ($request->has('role_name')) {
                $role = \App\Models\Role\Role::where('name', $request->role_name)->firstOrFail();
                $level->role_id = $role->id;
            }

            $level->save();

            // Invalidate workflow cache
            $this->approvalWorkflowService->invalidateCache($workspace->id);

            return $this->successResponse(
                [
                    'id' => $level->id,
                    'level_number' => $level->level_number,
                    'level_name' => $level->level_name,
                    'role' => $level->role->name,
                ],
                'Level updated successfully',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update level: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove an approval level
     * 
     * DELETE /api/workspaces/{workspace}/approval-workflow/levels/{level}
     */
    public function removeLevel(Request $request, $idOrSlug, $levelId): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);

            // Check authorization
            $this->authorize('modifyLevels', [ApprovalWorkflow::class, $workspace]);

            $level = ApprovalLevel::findOrFail($levelId);

            // Verify level belongs to workspace
            if ($level->workflow->workspace_id !== $workspace->id) {
                return $this->errorResponse('Unauthorized', 403);
            }

            $level->delete();

            // Invalidate workflow cache
            $this->approvalWorkflowService->invalidateCache($workspace->id);

            return $this->successResponse(
                null,
                'Level removed successfully',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to remove level: ' . $e->getMessage(), 500);
        }
    }
}
