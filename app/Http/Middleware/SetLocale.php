<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Prioridad de detección de idioma:
        // 1. Preferencia del usuario autenticado
        // 2. Header Accept-Language del request
        // 3. Idioma por defecto (español)
        
        $locale = config('app.locale', 'es'); // Default from config
        
        // Verificar si el usuario está autenticado y tiene preferencia
        if ($request->user() && $request->user()->locale) {
            $locale = $request->user()->locale;
        }
        // Si no, usar el header Accept-Language
        elseif ($request->hasHeader('Accept-Language')) {
            $acceptLanguage = $request->header('Accept-Language');
            // Extraer el primer idioma del header (ej: "es-ES,es;q=0.9,en;q=0.8" -> "es")
            $primaryLocale = substr($acceptLanguage, 0, 2);
            
            // Validar que el idioma esté soportado
            $supportedLocales = config('app.available_locales', ['en', 'es']);
            if (in_array($primaryLocale, $supportedLocales)) {
                $locale = $primaryLocale;
            }
        }
        
        // Establecer el idioma de la aplicación
        App::setLocale($locale);
        
        return $next($request);
    }
}
