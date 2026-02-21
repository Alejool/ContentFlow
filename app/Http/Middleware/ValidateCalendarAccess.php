<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateCalendarAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Ensure user is authenticated
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Get workspace from request or session
        $workspaceId = $request->input('workspace_id') 
            ?? $request->route('workspace_id') 
            ?? session('current_workspace_id');

        if (!$workspaceId) {
            return response()->json([
                'message' => 'No workspace selected.',
            ], 400);
        }

        // Check if user has access to the workspace
        $hasAccess = $user->workspaces()
            ->where('workspaces.id', $workspaceId)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'message' => 'You do not have access to this workspace.',
            ], 403);
        }

        // Add workspace ID to request for easy access in controllers
        $request->merge(['validated_workspace_id' => $workspaceId]);

        return $next($request);
    }
}
