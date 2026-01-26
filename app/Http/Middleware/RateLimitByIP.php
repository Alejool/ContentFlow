<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RateLimitByIP
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->ip();
        $maxAttempts = 60; // Configurable
        $decayMinutes = 1;

        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            return response()->json([
                'message' => 'Too many requests.',
                'retry_after' => \Illuminate\Support\Facades\RateLimiter::availableIn($key)
            ], 429);
        }

        \Illuminate\Support\Facades\RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', \Illuminate\Support\Facades\RateLimiter::remaining($key, $maxAttempts));

        return $response;
    }
}
