<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Cache;

class CacheHelper
{
    /**
     * Caché con TTL corto para versión demo (reduce carga en DB)
     */
    public static function remember(string $key, callable $callback, ?int $ttl = null): mixed
    {
        // TTL por defecto: 5 minutos (en lugar de 1 hora)
        $ttl = $ttl ?? 300;
        
        return Cache::remember($key, $ttl, $callback);
    }
    
    /**
     * Caché para queries pesados (TTL más largo)
     */
    public static function rememberHeavy(string $key, callable $callback, ?int $ttl = null): mixed
    {
        // TTL: 15 minutos para queries pesados
        $ttl = $ttl ?? 900;
        
        return Cache::remember($key, $ttl, $callback);
    }
    
    /**
     * Caché ultra corto para datos que cambian frecuentemente
     */
    public static function rememberShort(string $key, callable $callback, ?int $ttl = null): mixed
    {
        // TTL: 1 minuto
        $ttl = $ttl ?? 60;
        
        return Cache::remember($key, $ttl, $callback);
    }
    
    /**
     * Invalidar caché por patrón (usar con cuidado)
     */
    public static function forgetPattern(string $pattern): int
    {
        // Para database driver, necesitamos hacer query directo
        if (config('cache.default') === 'database') {
            return \DB::table('cache')
                ->where('key', 'like', config('cache.prefix') . $pattern)
                ->delete();
        }
        
        // Para Redis u otros drivers
        return Cache::flush();
    }
}
