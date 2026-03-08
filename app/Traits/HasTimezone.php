<?php

namespace App\Traits;

use Carbon\Carbon;

trait HasTimezone
{
    /**
     * Convierte una fecha local a UTC para guardar en BD.
     * 
     * IMPORTANTE: La fecha se guarda SIEMPRE en UTC en la base de datos.
     * El backend solo usa timezone para validaciones (horarios de programación, etc).
     *
     * @param string|Carbon $date Fecha en zona horaria local
     * @param string|null $timezone Zona horaria (si no se proporciona, usa jerarquía)
     * @return Carbon Fecha en UTC
     */
    public function toUTC($date, ?string $timezone = null): Carbon
    {
        $tz = $timezone ?? $this->getTimezone();
        
        return Carbon::parse($date, $tz)->setTimezone('UTC');
    }

    /**
     * Convierte una fecha UTC de la BD a la zona horaria del workspace/usuario.
     * 
     * NOTA: Esta conversión se hace principalmente en el FRONTEND.
     * El backend mantiene todo en UTC y solo convierte para validaciones.
     *
     * @param string|Carbon $date Fecha en UTC
     * @param string|null $timezone Zona horaria (si no se proporciona, usa jerarquía)
     * @return Carbon Fecha en zona horaria local
     */
    public function toUserTimezone($date, ?string $timezone = null): Carbon
    {
        $tz = $timezone ?? $this->getTimezone();
        
        return Carbon::parse($date, 'UTC')->setTimezone($tz);
    }

    /**
     * Obtiene la zona horaria con jerarquía: Workspace > User > Header > Config
     * 
     * JERARQUÍA:
     * 1. Workspace timezone (prioridad máxima - todo el equipo usa la misma)
     * 2. User timezone (preferencia individual)
     * 3. Header X-User-Timezone (enviado por frontend)
     * 4. Config app.timezone (fallback a UTC)
     *
     * @return string
     */
    public function getTimezone(): string
    {
        // 1. Prioridad: Workspace timezone (para equipos distribuidos)
        if (auth()->check() && auth()->user()->currentWorkspace) {
            $workspaceTimezone = auth()->user()->currentWorkspace->timezone;
            if ($workspaceTimezone) {
                return $workspaceTimezone;
            }
        }

        // 2. User timezone (preferencia individual)
        if (auth()->check() && auth()->user()->timezone) {
            return auth()->user()->timezone;
        }

        // 3. Header X-User-Timezone (enviado por frontend)
        if (request()->header('X-User-Timezone')) {
            return request()->header('X-User-Timezone');
        }

        // 4. Fallback a configuración (UTC por defecto)
        return config('app.timezone', 'UTC');
    }

    /**
     * Obtiene la zona horaria del workspace actual.
     *
     * @return string|null
     */
    public function getWorkspaceTimezone(): ?string
    {
        if (auth()->check() && auth()->user()->currentWorkspace) {
            return auth()->user()->currentWorkspace->timezone;
        }

        return null;
    }

    /**
     * Obtiene la zona horaria del usuario autenticado.
     *
     * @return string|null
     */
    public function getUserTimezone(): ?string
    {
        return auth()->user()?->timezone;
    }
}
