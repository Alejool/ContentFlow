<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SetUserTimezone
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Si el usuario está autenticado y tiene una zona horaria configurada
        if (Auth::check() && Auth::user()->timezone) {
            config(['app.timezone' => Auth::user()->timezone]);
            date_default_timezone_set(Auth::user()->timezone);
        }

        return $next($request);
    }
}
