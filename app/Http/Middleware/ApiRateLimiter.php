<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\Subscription\GranularLimitValidator;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para rate limiting de API basado en el plan del workspace.
 * 
 * Uso:
 * Route::group(['middleware' => 'api.rate.limit'], function () {
 *     // Rutas de API
 * });
 */
class ApiRateLimiter
{
    public function __construct(
        private GranularLimitValidator $validator
    ) {}

    public function handle(Request $request, Closure $next, string $endpoint = 'general'): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
        
        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 403);
        }

        // Verificar límite por minuto
        if (!$this->validator->checkApiRateLimit($workspace, $endpoint)) {
            return response()->json([
                'error' => 'Rate limit exceeded',
                'message' => 'Has excedido el límite de requests por minuto. Por favor, espera un momento.',
                'retry_after' => 60,
                'limit_type' => 'api_requests_per_minute',
            ], 429);
        }

        // Verificar límite por hora
        if (!$this->validator->checkApiRateLimitHourly($workspace, $endpoint)) {
            return response()->json([
                'error' => 'Rate limit exceeded',
                'message' => 'Has excedido el límite de requests por hora. Por favor, espera.',
                'retry_after' => 3600,
                'limit_type' => 'api_requests_per_hour',
            ], 429);
        }

        $response = $next($request);

        // Agregar headers de rate limit
        $limits = $this->validator->getGranularLimits($workspace);
        $response->headers->set('X-RateLimit-Limit-Minute', $limits['api_requests_per_minute'] ?? 10);
        $response->headers->set('X-RateLimit-Limit-Hour', $limits['api_requests_per_hour'] ?? 100);

        return $response;
    }
}
