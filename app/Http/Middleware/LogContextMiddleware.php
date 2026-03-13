<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware que agrega contexto automático a todos los logs
 * Implementa Trace ID para seguimiento de requests completos
 */
class LogContextMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Generar o recuperar Trace ID
        $traceId = $request->header('X-Trace-Id') ?? Str::uuid()->toString();
        
        // Agregar Trace ID al request para uso posterior
        $request->headers->set('X-Trace-Id', $traceId);
        
        // Configurar contexto global para todos los logs
        Log::withContext([
            'trace_id' => $traceId,
            'user_id' => auth()->id(),
            'workspace_id' => session('workspace_id') ?? auth()->user()?->current_workspace_id,
            'ip' => $request->ip(),
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'user_agent' => $request->userAgent(),
        ]);

        $response = $next($request);

        // Agregar Trace ID a la respuesta para debugging
        $response->headers->set('X-Trace-Id', $traceId);

        return $response;
    }
}
