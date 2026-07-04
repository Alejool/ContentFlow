<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\AssignRoleRequest;
use App\Http\Requests\Role\RevokeRoleRequest;
use App\Models\Auth\Role;
use App\Repositories\RoleRepository;
use App\Services\Roles\RoleService;
use App\Traits\System\ApiResponse;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected RoleService $roleService,
        protected RoleRepository $roles,
    ) {}

    /**
     * Assign a role to a user in a workspace.
     * POST /api/workspaces/{workspace}/roles/assign
     */
    public function assign(AssignRoleRequest $request, $idOrSlug): JsonResponse
    {
        try {
            $workspace = $this->roles->findWorkspaceFlexible($idOrSlug);
            $user = $this->roles->findUser($request->user_id);

            $this->authorize('assignRole', [Role::class, $workspace, $request->role_name]);
            $this->roleService->assignRole($user, $workspace, $request->role_name);

            return $this->successResponse([
                'user_id' => $user->id,
                'role' => $request->role_name,
                'workspace_id' => $workspace->id,
            ], 'Role assigned successfully', 200);
        } catch (\App\Exceptions\Auth\RoleNotFoundException $e) {
            return $this->errorResponse($e->getMessage(), 404);
        } catch (\App\Exceptions\Auth\InsufficientPermissionsException $e) {
            return $this->errorResponse($e->getMessage(), 403);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to assign role: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Revoke a user's role (resets to viewer).
     * DELETE /api/workspaces/{workspace}/roles/revoke
     */
    public function revoke(RevokeRoleRequest $request, $idOrSlug): JsonResponse
    {
        try {
            $workspace = $this->roles->findWorkspaceFlexible($idOrSlug);
            $user = $this->roles->findUser($request->user_id);

            $this->authorize('revokeRole', [Role::class, $workspace, $user]);
            $this->roleService->assignRole($user, $workspace, Role::VIEWER);

            return $this->successResponse([
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
            ], 'Role revoked successfully', 200);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to revoke role: ' . $e->getMessage(), 500);
        }
    }

    /**
     * List all roles with their permissions.
     * GET /api/workspaces/{workspace}/roles
     */
    public function index($idOrSlug): JsonResponse
    {
        try {
            $this->roles->findWorkspaceFlexible($idOrSlug);

            return $this->successResponse($this->roleService->listAllRoles()->toArray());
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve roles: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get a user's permissions in a workspace.
     * GET /api/workspaces/{workspace}/users/{user}/permissions
     */
    public function permissions($idOrSlug, $userId): JsonResponse
    {
        try {
            $workspace = $this->roles->findWorkspaceFlexible($idOrSlug);
            $user = $this->roles->findUser($userId);

            return $this->successResponse([
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
                'permissions' => $this->roleService->getUserPermissions($user, $workspace),
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve permissions: ' . $e->getMessage(), 500);
        }
    }
}
