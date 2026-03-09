<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;

class CheckNewRegistrations
{
    /**
     * Verificar si los nuevos registros están permitidos
     */
    public function handle(Request $request, Closure $next)
    {
        // Solo aplicar a rutas de registro
        if (!$request->routeIs('register') && !$request->routeIs('register.store')) {
            return $next($request);
        }
        
        // Verificar si los nuevos registros están permitidos
        $newRegistrationsEnabled = SystemSetting::getFresh('system.new_registrations', true);
        
        if (!$newRegistrationsEnabled) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Los registros de nuevos usuarios están temporalmente deshabilitados.',
                ], 403);
            }
            
            return redirect()->route('login')->with('error', 'Los registros de nuevos usuarios están temporalmente deshabilitados. Por favor, intenta más tarde.');
        }

        return $next($request);
    }
}
