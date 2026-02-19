<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware for caching HTTP responses
 * Useful for API endpoints that return frequently accessed data
 */
class CacheResponse
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, int $ttl = 300): Response
    {
        // Only cache GET requests
        if (!$request->isMethod('GET')) {
            return $next($request);
        }

        // Generate cache key from request
        $cacheKey = $this->getCacheKey($request);

        // Try to get cached response
        $cachedResponse = Cache::get($cacheKey);

        if ($cachedResponse !== null) {
            return response($cachedResponse['content'], $cachedResponse['status'])
                ->withHeaders(array_merge($cachedResponse['headers'], [
                    'X-Cache' => 'HIT',
                    'X-Cache-Key' => $cacheKey,
                ]));
        }

        // Process request
        $response = $next($request);

        // Cache successful responses
        if ($response->isSuccessful()) {
            Cache::put($cacheKey, [
                'content' => $response->getContent(),
                'status' => $response->getStatusCode(),
                'headers' => $response->headers->all(),
            ], $ttl);

            $response->headers->set('X-Cache', 'MISS');
            $response->headers->set('X-Cache-Key', $cacheKey);
        }

        return $response;
    }

    /**
     * Generate cache key from request
     */
    private function getCacheKey(Request $request): string
    {
        $key = 'http_cache:' . $request->fullUrl();
        
        // Include user ID for user-specific responses
        if ($request->user()) {
            $key .= ':user:' . $request->user()->id;
        }
        
        // Include workspace ID if present
        if ($request->user()?->current_workspace_id) {
            $key .= ':workspace:' . $request->user()->current_workspace_id;
        }

        return md5($key);
    }
}
