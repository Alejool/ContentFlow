<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ThrottleByPlan
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return $next($request);
        }

        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
        
        if (!$workspace || !$workspace->subscription) {
            return $next($request);
        }

        $plan = $workspace->subscription->plan;

        $limits = [
            'free' => 10,           // 10 requests/minute
            'starter' => 60,        // 60 requests/minute
            'professional' => 300,  // 300 requests/minute
            'enterprise' => 1000,   // 1000 requests/minute
        ];

        $limit = $limits[$plan] ?? 10;
        $key = "api:{$workspace->id}";

        $executed = RateLimiter::attempt(
            $key,
            $limit,
            function() use ($next, $request) {
                return $next($request);
            },
            60
        );

        if (!$executed) {
            return response()->json([
                'error' => 'Too many requests',
                'message' => 'Has excedido el límite de solicitudes por minuto para tu plan.',
                'retry_after' => RateLimiter::availableIn($key),
            ], 429);
        }

        return $executed;
    }
}
