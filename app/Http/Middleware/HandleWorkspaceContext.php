<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class HandleWorkspaceContext
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            // Ensure the user has a current workspace
            if (!$user->current_workspace_id) {
                $firstWorkspace = $user->workspaces()->first();
                if ($firstWorkspace) {
                    $user->update(['current_workspace_id' => $firstWorkspace->id]);
                }
            }

            // Verify the user still belongs to the current workspace
            if ($user->current_workspace_id) {
                $exists = $user->workspaces()->where('workspaces.id', $user->current_workspace_id)->exists();
                if (!$exists) {
                    $firstWorkspace = $user->workspaces()->first();
                    $user->update(['current_workspace_id' => $firstWorkspace ? $firstWorkspace->id : null]);
                }
            }
        }

        return $next($request);
    }
}
