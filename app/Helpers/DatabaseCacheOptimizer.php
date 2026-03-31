<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Optimizador de caché para database driver
 * Reduce queries y mejora performance cuando se usa PostgreSQL como caché
 */
class DatabaseCacheOptimizer
{
    /**
     * Caché en memoria para el request actual (evita queries repetidas)
     */
    private static array $requestCache = [];
    
    /**
     * Obtener múltiples valores de caché en una sola query
     * Mucho más eficiente que Cache::get() múltiples veces
     */
    public static function getMany(array $keys): array
    {
        if (config('cache.default') !== 'database') {
            return Cache::many($keys);
        }
        
        // Para database, hacer una sola query
        $prefix = config('cache.prefix');
        $prefixedKeys = array_map(fn($k) => $prefix . $k, $keys);
        
        $results = DB::table('cache')
            ->whereIn('key', $prefixedKeys)
            ->where('expiration', '>', time())
            ->get(['key', 'value'])
            ->mapWithKeys(function ($item) use ($prefix) {
                $originalKey = str_replace($prefix, '', $item->key);
                return [$originalKey => unserialize($item->value)];
            })
            ->toArray();
        
        // Rellenar con null los keys que no existen
        foreach ($keys as $key) {
            if (!isset($results[$key])) {
                $results[$key] = null;
            }
        }
        
        return $results;
    }
    
    /**
     * Guardar múltiples valores en una sola transacción
     */
    public static function putMany(array $values, int $ttl = 3600): bool
    {
        if (config('cache.default') !== 'database') {
            return Cache::putMany($values, $ttl);
        }
        
        $prefix = config('cache.prefix');
        $expiration = time() + $ttl;
        
        $records = [];
        foreach ($values as $key => $value) {
            $records[] = [
                'key' => $prefix . $key,
                'value' => serialize($value),
                'expiration' => $expiration,
            ];
        }
        
        // Usar upsert para insertar o actualizar
        DB::table('cache')->upsert(
            $records,
            ['key'],
            ['value', 'expiration']
        );
        
        return true;
    }
    
    /**
     * Caché en memoria del request (no toca DB)
     * Útil para datos que se acceden múltiples veces en el mismo request
     */
    public static function rememberForRequest(string $key, callable $callback): mixed
    {
        if (!isset(self::$requestCache[$key])) {
            self::$requestCache[$key] = $callback();
        }
        
        return self::$requestCache[$key];
    }
    
    /**
     * Limpiar caché del request (útil en tests)
     */
    public static function clearRequestCache(): void
    {
        self::$requestCache = [];
    }
    
    /**
     * Caché con fallback: intenta caché, si falla usa request cache
     */
    public static function rememberSafe(string $key, callable $callback, int $ttl = 300): mixed
    {
        try {
            return Cache::remember($key, $ttl, $callback);
        } catch (\Exception $e) {
            // Si falla el caché (DB saturado), usar request cache
            \Log::warning("Cache failed, using request cache: {$e->getMessage()}");
            return self::rememberForRequest($key, $callback);
        }
    }
    
    /**
     * Invalidar múltiples keys por patrón (solo para database)
     */
    public static function forgetPattern(string $pattern): int
    {
        if (config('cache.default') !== 'database') {
            Cache::flush();
            return 0;
        }
        
        $prefix = config('cache.prefix');
        return DB::table('cache')
            ->where('key', 'like', $prefix . $pattern)
            ->delete();
    }
    
    /**
     * Obtener estadísticas de uso de caché
     */
    public static function getStats(): array
    {
        if (config('cache.default') !== 'database') {
            return ['driver' => config('cache.default')];
        }
        
        $now = time();
        
        return [
            'driver' => 'database',
            'total_entries' => DB::table('cache')->count(),
            'active_entries' => DB::table('cache')->where('expiration', '>', $now)->count(),
            'expired_entries' => DB::table('cache')->where('expiration', '<=', $now)->count(),
            'total_locks' => DB::table('cache_locks')->count(),
            'expired_locks' => DB::table('cache_locks')->where('expiration', '<=', $now)->count(),
            'table_size' => DB::selectOne("
                SELECT pg_size_pretty(pg_total_relation_size('cache')) as size
            ")->size ?? 'N/A',
        ];
    }
    
    /**
     * Limpiar entradas expiradas (manual)
     */
    public static function cleanup(): array
    {
        if (config('cache.default') !== 'database') {
            return ['message' => 'Not using database cache'];
        }
        
        $now = time();
        
        $deletedCache = DB::table('cache')
            ->where('expiration', '<', $now)
            ->delete();
        
        $deletedLocks = DB::table('cache_locks')
            ->where('expiration', '<', $now)
            ->delete();
        
        // VACUUM para recuperar espacio
        DB::statement('VACUUM ANALYZE cache');
        DB::statement('VACUUM ANALYZE cache_locks');
        
        return [
            'deleted_cache' => $deletedCache,
            'deleted_locks' => $deletedLocks,
        ];
    }
}
