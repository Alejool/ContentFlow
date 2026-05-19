<?php

namespace App\Http\Middleware\System;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CustomRateLimiter
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Obtener límite basado en usuario, rol y endpoint
        $key = $this->resolveRequestSignature($request);
        $limit = $this->getLimitForEndpoint($request->route()?->getName(), $request->user());
        
        // Aplicar rate limiting
        $executed = RateLimiter::attempt(
            $key,
            $limit,
            function () use ($next, $request) {
                return $next($request);
            },
            60 // decay in seconds (1 minute)
        );
        
        if (!$executed) {
            // Calcular tiempo de espera
            $retryAfter = RateLimiter::availableIn($key);
            
            throw new HttpException(
                429,
                'Too many requests. Please try again later.',
                null,
                ['Retry-After' => $retryAfter]
            );
        }
        
        return $executed;
    }
    
    /**
     * Resolve request signature for rate limiting.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string
     */
    private function resolveRequestSignature(Request $request): string
    {
        return sprintf(
            '%s|%s|%s',
            $request->user()?->id ?? $request->ip(),
            $request->route()?->getName() ?? $request->path(),
            $request->method()
        );
    }
    
    /**
     * Get rate limit for endpoint based on user role.
     *
     * @param  string|null  $routeName
     * @param  \App\Models\User|null  $user
     * @return int
     */
    private function getLimitForEndpoint(?string $routeName, $user): int
    {
        $endpoints = config('api_rate_limits.endpoints', []);
        $config = ($routeName && isset($endpoints[$routeName])) ? $endpoints[$routeName] : ($endpoints['default'] ?? []);
        
        // Verificar si el usuario tiene un límite específico por rol
        if ($user && isset($config['roles'][$user->role])) {
            return $config['roles'][$user->role];
        }
        
        // Retornar límite por defecto
        return $config['default'] ?? 60;
    }
}
