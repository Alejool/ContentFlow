<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\AssignRoleRequest;
use App\Http\Requests\Role\RevokeRoleRequest;
use App\Http\Requests\Role\UpdateRolePermissionsRequest;
use App\Repositories\RoleRepository;
use App\Services\Roles\RoleService;
use App\Traits\System\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    use ApiResponse;

    public function __construct(
        private RoleService $roleService,
        private RoleRepository $roles,
    ) {}

    /**
     * Assign a role to a user in a workspace.
     * POST /api/v1/workspaces/{workspace}/roles/assign
     */
    public function assign(AssignRoleRequest $request, string $idOrSlug): JsonResponse
    {
        $workspace = $this->roles->findWorkspace($idOrSlug);
        $user = $this->roles->findUser($request->validated('user_id'));

        try {
            $this->roleService->assignRole(
                $user,
                $workspace,
                $request->validated('role_name'),
                Auth::user()
            );

            return $this->successResponse([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'role_name' => $request->validated('role_name'),
                'workspace_id' => $workspace->id,
                'workspace_slug' => $workspace->slug,
            ], 'Role assigned successfully.', 200);
        } catch (\App\Exceptions\Auth\RoleNotFoundException $e) {
            return $this->errorResponse($e->getMessage(), 404);
        } catch (\App\Exceptions\Auth\InsufficientPermissionsException $e) {
            return $this->errorResponse($e->getMessage(), 403);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'An error occurred while assigning the role.',
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }

    /**
     * Revoke a user's role in a workspace.
     * DELETE /api/v1/workspaces/{workspace}/roles/revoke
     */
    public function revoke(RevokeRoleRequest $request, string $idOrSlug): JsonResponse
    {
        $workspace = $this->roles->findWorkspace($idOrSlug);
        $user = $this->roles->findUser($request->validated('user_id'));

        $result = $this->roleService->revokeRole($user, $workspace, Auth::user());
        if (!$result['ok']) {
            return $this->errorResponse($result['error'], $result['status']);
        }

        return $this->successResponse([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'workspace_id' => $workspace->id,
            'workspace_slug' => $workspace->slug,
        ], 'Role revoked successfully.', 200);
    }

    /**
     * List all system roles with their permissions.
     * GET /api/v1/workspaces/{workspace}/roles
     */
    public function index(string $idOrSlug): JsonResponse
    {
        $this->roles->findWorkspace($idOrSlug);

        return $this->successResponse(
            ['roles' => $this->roleService->listSystemRoles()],
            'Roles retrieved successfully.',
            200
        );
    }

    /**
     * Update role fields and permissions.
     * PUT /api/v1/workspaces/{workspace}/roles/{role}
     */
    public function update(UpdateRolePermissionsRequest $request, string $idOrSlug, int $roleId): JsonResponse
    {
        $workspace = $this->roles->findWorkspace($idOrSlug);
        $role = $this->roles->findRole($roleId);

        if (!$this->roleService->userHasPermission(Auth::user(), $workspace, 'manage-team')) {
            return $this->errorResponse('You do not have permission to update roles.', 403);
        }

        $result = $this->roleService->updateRolePermissions($role, $request->validated());
        if (!$result['ok']) {
            return $this->errorResponse($result['error'], $result['status']);
        }

        return $this->successResponse(
            ['role' => $result['role'], 'color_saved' => $result['color_saved']],
            'Role updated successfully.',
            200
        );
    }

    /**
     * Delete a custom role.
     * DELETE /api/v1/workspaces/{workspace}/roles/{role}
     */
    public function destroy(string $idOrSlug, int $roleId): JsonResponse
    {
        $workspace = $this->roles->findWorkspace($idOrSlug);
        $role = $this->roles->findRole($roleId);

        if (!$this->roleService->userHasPermission(Auth::user(), $workspace, 'manage-team')) {
            return $this->errorResponse('You do not have permission to delete roles.', 403);
        }

        $result = $this->roleService->deleteRole($role, $workspace);
        if (!$result['ok']) {
            return $this->errorResponse($result['error'], $result['status']);
        }

        return $this->successResponse(['role_id' => $roleId], 'Role deleted successfully.', 200);
    }

    /**
     * Get a user's permissions in a workspace.
     * GET /api/v1/workspaces/{workspace}/users/{user}/permissions
     */
    public function permissions(string $idOrSlug, int $userId): JsonResponse
    {
        $workspace = $this->roles->findWorkspace($idOrSlug);
        $user = $this->roles->findUser($userId);

        try {
            return $this->successResponse([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'workspace_id' => $workspace->id,
                'workspace_slug' => $workspace->slug,
                'role' => $this->roleService->userRoleSummary($user, $workspace),
                'permissions' => $this->roleService->getUserPermissions($user, $workspace),
            ], 'User permissions retrieved successfully.', 200);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'An error occurred while retrieving user permissions.',
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }
}
