<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\SystemSetting;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureEnabled
{
    /**
     * Handle an incoming request.
     *
     * @param  string  $feature  Feature key to check (e.g., 'ai', 'analytics', 'reels')
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        if (!SystemSetting::isFeatureEnabled($feature)) {
            // Si es una petición API, devolver JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'Esta característica no está disponible actualmente',
                    'feature' => $feature,
                ], 403);
            }

            // Si es una petición web, redirigir con mensaje
            return redirect()->route('dashboard')
                ->with('error', 'Esta característica no está disponible actualmente.');
        }

        return $next($request);
    }
}
