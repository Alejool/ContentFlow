<?php

namespace App\Http\Middleware\Api;

use App\Constants\ApiScopes;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enforces Sanctum token abilities on API routes.
 *
 * Usage in routes:
 *   ->middleware('token.ability:publications:read')
 *   ->middleware('token.ability:publications:create,publications:update')
 *
 * Tokens with the wildcard ability '*' always pass.
 *
 * ROUTE MAP (automatic enforcement without decorating every route):
 * Apply this middleware to route groups via CheckTokenAbility::forGroup('publications')
 * which returns the abilities string for the full group's read+write access.
 *
 * HOW TO ADD ENFORCEMENT FOR A NEW ROUTE:
 * Option A (per-route): Add ->middleware('token.ability:your:scope') in routes/api/*.php.
 * Option B (group):     Add the scope to ApiScopes::groups() and apply the group
 *                       middleware to the route group.
 */
class CheckTokenAbility
{
    /**
     * Handle an incoming request.
     *
     * @param  string  $abilities  Comma-separated list of required abilities.
     *                            The token must have AT LEAST ONE of them
     *                            (OR logic, like Sanctum's checkForAnyAbility).
     */
    public function handle(Request $request, Closure $next, string ...$abilities): Response
    {
        $token = $request->user()?->currentAccessToken();

        // No token present — let auth middleware handle it.
        if (!$token) {
            return $next($request);
        }

        // Wildcard token passes all ability checks.
        if ($token->can('*')) {
            return $next($request);
        }

        // Token must have at least one of the required abilities.
        foreach ($abilities as $ability) {
            if ($token->can($ability)) {
                return $next($request);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'This token does not have permission to perform this action.',
            'required_abilities' => $abilities,
            'code' => 'TOKEN_INSUFFICIENT_SCOPE',
        ], 403);
    }
}
