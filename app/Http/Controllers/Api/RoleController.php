<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\AssignRoleRequest;
use App\Http\Requests\Role\RevokeRoleRequest;
use App\Models\Role\Role;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\RoleService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected RoleService $roleService
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
     * Assign a role to a user in a workspace
     * 
     * POST /api/workspaces/{workspace}/roles/assign
     */
    public function assign(AssignRoleRequest $request, $idOrSlug): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);
            $user = User::findOrFail($request->user_id);

            // Check authorization
            $this->authorize('assignRole', [Role::class, $workspace, $request->role_name]);

            // Assign role
            $this->roleService->assignRole($user, $workspace, $request->role_name);

            return $this->successResponse(
                [
                    'user_id' => $user->id,
                    'role' => $request->role_name,
                    'workspace_id' => $workspace->id,
                ],
                'Role assigned successfully',
                200
            );
        } catch (\App\Exceptions\RoleNotFoundException $e) {
            return $this->errorResponse($e->getMessage(), 404);
        } catch (\App\Exceptions\InsufficientPermissionsException $e) {
            return $this->errorResponse($e->getMessage(), 403);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to assign role: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Revoke a user's role in a workspace
     * 
     * DELETE /api/workspaces/{workspace}/roles/revoke
     */
    public function revoke(RevokeRoleRequest $request, $idOrSlug): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);
            $user = User::findOrFail($request->user_id);

            // Check authorization
            $this->authorize('revokeRole', [Role::class, $workspace, $user]);

            // Revoke role (assign viewer as default)
            $this->roleService->assignRole($user, $workspace, Role::VIEWER);

            return $this->successResponse(
                [
                    'user_id' => $user->id,
                    'workspace_id' => $workspace->id,
                ],
                'Role revoked successfully',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to revoke role: ' . $e->getMessage(), 500);
        }
    }

    /**
     * List all roles with their permissions
     * 
     * GET /api/workspaces/{workspace}/roles
     */
    public function index(Request $request, $idOrSlug): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);

            // Get all roles with permissions
            $roles = Role::with('permissions')->get()->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'description' => $role->description,
                    'is_system_role' => $role->is_system_role,
                    'approval_participant' => $role->approval_participant,
                    'permissions' => $role->permissions->pluck('name')->toArray(),
                ];
            });

            return $this->successResponse($roles->toArray());
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve roles: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get user permissions in a workspace
     * 
     * GET /api/workspaces/{workspace}/users/{user}/permissions
     */
    public function permissions(Request $request, $idOrSlug, $userId): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);
            $user = User::findOrFail($userId);

            // Get user permissions
            $permissions = $this->roleService->getUserPermissions($user, $workspace);

            return $this->successResponse([
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
                'permissions' => $permissions,
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve permissions: ' . $e->getMessage(), 500);
        }
    }
}
