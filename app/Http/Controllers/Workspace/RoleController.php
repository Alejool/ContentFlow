<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\AssignRoleRequest;
use App\Http\Requests\Role\RevokeRoleRequest;
use App\Models\Role\Role;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\RoleService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    use ApiResponse;

    public function __construct(
        private RoleService $roleService
    ) {}

    /**
     * Assign a role to a user in a workspace
     * 
     * POST /api/v1/workspaces/{workspace}/roles/assign
     * 
     * @param AssignRoleRequest $request
     * @param string $idOrSlug Workspace ID or slug
     * @return JsonResponse
     */
    public function assign(AssignRoleRequest $request, string $idOrSlug): JsonResponse
    {
        // Find workspace by ID or slug
        $workspace = Workspace::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        // Find the user to assign the role to
        $user = User::findOrFail($request->validated('user_id'));

        // Get the authenticated user (assigner)
        $assigner = Auth::user();

        try {
            // Assign the role
            $this->roleService->assignRole(
                $user,
                $workspace,
                $request->validated('role_name'),
                $assigner
            );

            return $this->successResponse(
                [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'role_name' => $request->validated('role_name'),
                    'workspace_id' => $workspace->id,
                    'workspace_slug' => $workspace->slug,
                ],
                'Role assigned successfully.',
                200
            );
        } catch (\App\Exceptions\RoleNotFoundException $e) {
            return $this->errorResponse($e->getMessage(), 404);
        } catch (\App\Exceptions\InsufficientPermissionsException $e) {
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
     * Revoke a user's role in a workspace
     * 
     * DELETE /api/v1/workspaces/{workspace}/roles/revoke
     * 
     * @param RevokeRoleRequest $request
     * @param string $idOrSlug Workspace ID or slug
     * @return JsonResponse
     */
    public function revoke(RevokeRoleRequest $request, string $idOrSlug): JsonResponse
    {
        // Find workspace by ID or slug
        $workspace = Workspace::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        // Find the user to revoke the role from
        $user = User::findOrFail($request->validated('user_id'));

        // Get the authenticated user (revoker)
        $assigner = Auth::user();

        // Check if the user trying to revoke is authorized
        // Get the user's current role in the workspace
        $userRolePivot = \Illuminate\Support\Facades\DB::table('role_user')
            ->where('user_id', $user->id)
            ->where('workspace_id', $workspace->id)
            ->first();

        if (!$userRolePivot) {
            return $this->errorResponse('User does not have a role in this workspace.', 404);
        }

        $userRole = Role::find($userRolePivot->role_id);

        // Prevent revoking Owner role
        if ($userRole && $userRole->name === Role::OWNER) {
            return $this->errorResponse('Cannot revoke the Owner role.', 403);
        }

        // Check if assigner can revoke this role
        if (!$this->roleService->canAssignRole($assigner, $userRole->name)) {
            return $this->errorResponse('You do not have permission to revoke this role.', 403);
        }

        try {
            // Remove the role assignment
            \Illuminate\Support\Facades\DB::table('role_user')
                ->where('user_id', $user->id)
                ->where('workspace_id', $workspace->id)
                ->delete();

            return $this->successResponse(
                [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'workspace_id' => $workspace->id,
                    'workspace_slug' => $workspace->slug,
                ],
                'Role revoked successfully.',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'An error occurred while revoking the role.',
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }

    /**
     * List all roles with their permissions
     * 
     * GET /api/v1/workspaces/{workspace}/roles
     * 
     * @param string $idOrSlug Workspace ID or slug
     * @return JsonResponse
     */
    public function index(string $idOrSlug): JsonResponse
    {
        // Find workspace by ID or slug
        $workspace = Workspace::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        try {
            // Get all system roles with their permissions
            $roles = Role::systemRoles()
                ->with('permissions')
                ->get()
                ->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'display_name' => $role->display_name,
                        'description' => $role->description,
                        'is_system_role' => $role->is_system_role,
                        'approval_participant' => $role->approval_participant,
                        'permissions' => $role->permissions->map(function ($permission) {
                            return [
                                'id' => $permission->id,
                                'name' => $permission->name,
                                'display_name' => $permission->display_name,
                                'description' => $permission->description,
                            ];
                        }),
                    ];
                });

            return $this->successResponse(
                ['roles' => $roles],
                'Roles retrieved successfully.',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'An error occurred while retrieving roles.',
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }

    /**
     * Get user permissions in a workspace
     * 
     * GET /api/v1/workspaces/{workspace}/users/{user}/permissions
     * 
     * @param string $idOrSlug Workspace ID or slug
     * @param int $userId User ID
     * @return JsonResponse
     */
    public function permissions(string $idOrSlug, int $userId): JsonResponse
    {
        // Find workspace by ID or slug
        $workspace = Workspace::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        // Find the user
        $user = User::findOrFail($userId);

        try {
            // Get user permissions
            $permissions = $this->roleService->getUserPermissions($user, $workspace);

            // Get user's role in the workspace
            $rolePivot = \Illuminate\Support\Facades\DB::table('role_user')
                ->where('user_id', $user->id)
                ->where('workspace_id', $workspace->id)
                ->first();

            $role = null;
            if ($rolePivot) {
                $roleModel = Role::find($rolePivot->role_id);
                if ($roleModel) {
                    $role = [
                        'id' => $roleModel->id,
                        'name' => $roleModel->name,
                        'display_name' => $roleModel->display_name,
                    ];
                }
            }

            return $this->successResponse(
                [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'workspace_id' => $workspace->id,
                    'workspace_slug' => $workspace->slug,
                    'role' => $role,
                    'permissions' => $permissions,
                ],
                'User permissions retrieved successfully.',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'An error occurred while retrieving user permissions.',
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }
}
