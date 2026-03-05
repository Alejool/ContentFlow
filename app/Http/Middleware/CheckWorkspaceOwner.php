<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckWorkspaceOwner
{
    /**
     * Handle an incoming request.
     *
     * Verifica que el usuario sea el owner del workspace actual.
     * Solo el owner puede gestionar suscripciones y pagos.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        
        $workspace = $user->currentWorkspace;
        
        if (!$workspace) {
            return response()->json([
                'error' => 'No workspace selected',
                'message' => 'Please select a workspace to continue',
            ], 400);
        }
        
        // Verificar que el usuario es el owner
        if (!$workspace->isOwner($user)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Only the workspace owner can perform this action',
                'workspace_owner' => $workspace->created_by,
                'current_user' => $user->id,
            ], 403);
        }
        
        return $next($request);
    }
}
