<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Require2FA
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 2FA desactivado - permitir acceso sin verificación
        return $next($request);
        
        /* CÓDIGO ORIGINAL - Descomentarlo para reactivar 2FA
        $user = $request->user();
        
        // Solo aplicar a admins
        if (!$user || !$user->is_super_admin) {
            return $next($request);
        }
        
        // Permitir acceso a las rutas de 2FA para evitar ciclos de redirección
        if ($request->routeIs('2fa.*')) {
            return $next($request);
        }
        
        // Verificar si 2FA está configurado
        if (!$user->two_factor_secret) {
            return redirect()->route('2fa.setup')
                ->with('warning', '2FA is required for admin accounts. Please complete the setup.');
        }
        
        // Verificar si la sesión está verificada con 2FA
        $sessionKey = '2fa_verified_' . $user->id;
        $timestampKey = '2fa_verified_at_' . $user->id;
        
        // Si no hay verificación en sesión, redirigir a verificar
        if (!session($sessionKey)) {
            return redirect()->route('2fa.verify')
                ->with('warning', 'Please verify your identity with 2FA to continue.');
        }
        
        // Verificar si la verificación ha expirado (30 días)
        $verifiedAt = session($timestampKey);
        if ($verifiedAt) {
            $expiresAt = $verifiedAt + (30 * 24 * 60 * 60); // 30 días en segundos
            
            // Si ha expirado, limpiar sesión y redirigir a verificar
            if (now()->timestamp > $expiresAt) {
                session()->forget([$sessionKey, $timestampKey]);
                return redirect()->route('2fa.verify')
                    ->with('info', 'Your 2FA verification has expired. Please verify again.');
            }
        }
        
        return $next($request);
        */
    }
}
