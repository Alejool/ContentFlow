<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use App\Models\Workspace\Workspace;

class CheckApiWorkspacePlan
{
  /**
   * Handle an incoming request.
   *
   * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
   * @param  string  ...$allowedPlans
   */
  public function handle(Request $request, Closure $next, ...$allowedPlans): Response
  {
    // Only run this logic if the request is authenticated via a Bearer Token.
    // If it's a cookie-based session (frontend SPA), let the existing app logic handle it.
    $bearerToken = $request->bearerToken();

    if ($bearerToken && Auth::guard('sanctum')->check()) {
      /** @var \App\Models\User|\App\Models\Workspace\Workspace $userOrWorkspace */
      $userOrWorkspace = Auth::guard('sanctum')->user();
      $token = $userOrWorkspace->currentAccessToken();

      $workspace = null;

      if ($userOrWorkspace instanceof Workspace) {
        // Dashboard token (tokenable is Workspace)
        $workspace = $userOrWorkspace;
      } elseif ($userOrWorkspace instanceof \App\Models\User) {
        // Programmatic token (tokenable is User)
        if ($token && str_starts_with($token->name, 'api-access:')) {
          $parts = explode(':', $token->name);
          $workspaceId = $parts[1] ?? null;
          if ($workspaceId) {
            $workspace = Workspace::find($workspaceId);
          }
        }
      }

      if (!$workspace) {
        return response()->json([
          'success' => false,
          'message' => 'Workspace context missing from API token.'
        ], 403);
      }

      $plan = tap($workspace->getPlanName(), function ($p) {}) ?? 'free';

      // Default to 'enterprise' if no plans specified
      if (empty($allowedPlans)) {
        $allowedPlans = ['enterprise'];
      }

      // Implement logical tiers
      if (in_array('premium', $allowedPlans)) {
        $allowedPlans = array_merge($allowedPlans, ['enterprise']);
      }
      if (in_array('basic', $allowedPlans)) {
        $allowedPlans = array_merge($allowedPlans, ['professional', 'enterprise']);
      }

      $allowedPlans = array_unique($allowedPlans);

      if (!in_array($plan, $allowedPlans)) {
        return response()->json([
          'success' => false,
          'message' => "La suscripción de este workspace actualizó al plan \"{$plan}\". Este endpoint de la API requiere acceso de nivel: " . implode(', ', $allowedPlans),
          'errors' => [
            'plan' => ['El nivel de suscripción actual no es suficiente para este endpoint.']
          ]
        ], 402);
      }

      // Bind workspace to request for convenience in controllers
      $request->attributes->set('api_workspace', $workspace);
    }

    return $next($request);
  }
}
