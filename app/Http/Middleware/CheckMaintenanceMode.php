<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CheckMaintenanceMode
{
    /**
     * Verificar si el sistema está en modo mantenimiento
     */
    public function handle(Request $request, Closure $next)
    {
        // Verificar si el modo mantenimiento está activo
        $maintenanceMode = SystemSetting::getFresh('system.maintenance_mode', false);
        
        if ($maintenanceMode) {
            $user = $request->user();
            
            // Permitir acceso solo a super admins
            if (!$user || !$user->is_super_admin) {
                return Inertia::render('Maintenance', [
                    'message' => 'El sistema está en mantenimiento. Volveremos pronto.',
                    'estimatedTime' => 'Estamos trabajando en mejoras para ti.',
                ])
                ->toResponse($request)
                ->setStatusCode(503);
            }
            
            // Si es super admin, permitir acceso pero mostrar banner
            Inertia::share([
                'maintenanceMode' => true,
                'maintenanceBanner' => 'El sistema está en modo mantenimiento. Solo tú puedes acceder.',
            ]);
        }

        return $next($request);
    }
}
