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
        $user = $request->user();
        
        // Solo aplicar a admins
        if (!$user || !$user->is_super_admin) {
            return $next($request);
        }
        
        // Verificar si 2FA está configurado
        if (!$user->two_factor_secret) {
            return redirect()->route('2fa.setup')
                ->with('error', '2FA is required for admin accounts');
        }
        
        // Verificar si la sesión está verificada con 2FA
        if (!session('2fa_verified')) {
            return redirect()->route('2fa.verify');
        }
        
        return $next($request);
    }
}
