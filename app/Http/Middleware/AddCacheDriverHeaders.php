<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddCacheDriverHeaders
{
    /**
     * Agregar headers de debug con información de drivers
     * Solo en desarrollo
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Solo en desarrollo
        if (config('app.env') !== 'production' && config('app.debug')) {
            $response->headers->set('X-Cache-Driver', config('cache.default'));
            $response->headers->set('X-Queue-Driver', config('queue.default'));
            $response->headers->set('X-Session-Driver', config('session.driver'));
            $response->headers->set('X-App-Env', config('app.env'));
        }

        return $response;
    }
}
