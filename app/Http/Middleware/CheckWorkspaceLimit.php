<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Exceptions\LimitReachedException;
use App\Services\WorkspaceUsageService;
use Symfony\Component\HttpFoundation\Response;

class CheckWorkspaceLimit
{
    public function __construct(
        private WorkspaceUsageService $usageService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $limitType): Response
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
        
        // Verificar límite
        if (!$this->usageService->canPerformAction($workspace, $limitType)) {
            $message = $this->usageService->getLimitReachedMessage($workspace, $limitType);
            $plan = $workspace->getPlanName();
            $limits = $workspace->getPlanLimits();
            
            throw new LimitReachedException($message, [
                'limit_type' => $limitType,
                'current_plan' => $plan,
                'limit' => $limits[$limitType] ?? 0,
                'workspace_id' => $workspace->id,
                'workspace_name' => $workspace->name,
                'upgrade_required' => true,
            ]);
        }
        
        return $next($request);
    }
}
