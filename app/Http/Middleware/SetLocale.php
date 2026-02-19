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
        // 1. Header Accept-Language del request
        // 2. Preferencia del usuario autenticado
        // 3. Idioma por defecto (español)
        
        $locale = 'es'; // Default
        
        // Verificar si el usuario está autenticado y tiene preferencia
        if ($request->user() && $request->user()->locale) {
            $locale = $request->user()->locale;
        }
        // Si no, usar el header Accept-Language
        elseif ($request->hasHeader('Accept-Language')) {
            $acceptLanguage = $request->header('Accept-Language');
            // Extraer el primer idioma del header (ej: "es-ES,es;q=0.9,en;q=0.8" -> "es")
            $locale = substr($acceptLanguage, 0, 2);
        }
        
        // Validar que el idioma esté soportado
        $supportedLocales = ['en', 'es'];
        if (!in_array($locale, $supportedLocales)) {
            $locale = 'es';
        }
        
        // Establecer el idioma de la aplicación
        App::setLocale($locale);
        
        return $next($request);
    }
}
