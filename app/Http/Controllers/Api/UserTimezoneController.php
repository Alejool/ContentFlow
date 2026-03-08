<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UserTimezoneController extends Controller
{
    /**
     * Actualiza la zona horaria del usuario.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'timezone' => ['required', 'string', 'timezone'],
        ]);

        $user = Auth::user();
        $user->timezone = $validated['timezone'];
        $user->save();

        return response()->json([
            'message' => 'Zona horaria actualizada correctamente',
            'timezone' => $user->timezone,
        ]);
    }

    /**
     * Obtiene la zona horaria actual del usuario.
     */
    public function show()
    {
        $user = Auth::user();
        
        return response()->json([
            'timezone' => $user->timezone ?? 'UTC',
            'available_timezones' => $this->getAvailableTimezones(),
        ]);
    }

    /**
     * Lista de zonas horarias disponibles agrupadas por región.
     */
    private function getAvailableTimezones(): array
    {
        $timezones = \DateTimeZone::listIdentifiers();
        $grouped = [];

        foreach ($timezones as $timezone) {
            $parts = explode('/', $timezone);
            $region = $parts[0];
            
            if (!isset($grouped[$region])) {
                $grouped[$region] = [];
            }
            
            $grouped[$region][] = [
                'value' => $timezone,
                'label' => str_replace('_', ' ', $timezone),
                'offset' => $this->getTimezoneOffset($timezone),
            ];
        }

        return $grouped;
    }

    /**
     * Obtiene el offset de una zona horaria.
     */
    private function getTimezoneOffset(string $timezone): string
    {
        $dateTime = new \DateTime('now', new \DateTimeZone($timezone));
        $offset = $dateTime->getOffset();
        
        $hours = floor($offset / 3600);
        $minutes = abs(($offset % 3600) / 60);
        
        return sprintf('%+03d:%02d', $hours, $minutes);
    }
}
