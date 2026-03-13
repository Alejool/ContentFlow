<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Role\Role;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to check if user has a specific role in the current workspace.
 */
class CheckWorkspaceRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $role  Role slug to check (e.g., 'owner', 'admin')
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'error' => 'Unauthenticated',
                'message' => 'You must be logged in to access this resource.'
            ], 401);
        }

        $workspaceId = $user->current_workspace_id;
        
        if (!$workspaceId) {
            return response()->json([
                'error' => 'No workspace selected',
                'message' => 'Please select a workspace to continue.'
            ], 400);
        }

        // Get user's role in the workspace
        $workspaceUser = $user->workspaces()
            ->where('workspaces.id', $workspaceId)
            ->first();

        if (!$workspaceUser || !$workspaceUser->pivot->role_id) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'You are not a member of this workspace.'
            ], 403);
        }

        $userRole = Role::find($workspaceUser->pivot->role_id);

        if (!$userRole || $userRole->slug !== $role) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => "You must be a {$role} to access this resource.",
                'required_role' => $role,
                'current_role' => $userRole ? $userRole->slug : null,
            ], 403);
        }

        return $next($request);
    }
}
