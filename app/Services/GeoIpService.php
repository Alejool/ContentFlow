<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Servicio de geolocalización por IP.
 * Obtiene país y timezone usando ipapi.co (free tier: 1000 req/day).
 */
class GeoIpService
{
    private const CACHE_TTL_DAYS = 7;
    private const LOCAL_IPS = ['127.0.0.1', '::1', 'localhost'];

    /**
     * Obtiene datos de geolocalización para una IP.
     * Retorna array con 'country_code', 'country', 'timezone' o null si falla.
     */
    public function lookup(string $ip): ?array
    {
        if (in_array($ip, self::LOCAL_IPS) || str_starts_with($ip, '192.168.') || str_starts_with($ip, '10.')) {
            return null;
        }

        $cacheKey = "geoip_{$ip}";

        return Cache::remember($cacheKey, now()->addDays(self::CACHE_TTL_DAYS), function () use ($ip) {
            try {
                $response = Http::timeout(5)->get("https://ipapi.co/{$ip}/json/");

                if (!$response->successful()) {
                    return null;
                }

                $data = $response->json();

                // ipapi.co devuelve error en el campo 'error' si la IP no es válida
                if (!empty($data['error'])) {
                    Log::warning('GeoIpService: IP lookup error', ['ip' => $ip, 'reason' => $data['reason'] ?? 'unknown']);
                    return null;
                }

                $countryCode = strtoupper($data['country_code'] ?? '');
                $country     = $data['country_name'] ?? null;
                $timezone    = $data['timezone'] ?? null;

                if (!$countryCode) {
                    return null;
                }

                return [
                    'country_code' => $countryCode,
                    'country'      => $country,
                    'timezone'     => $timezone,
                ];
            } catch (\Exception $e) {
                Log::warning('GeoIpService: lookup failed', ['ip' => $ip, 'error' => $e->getMessage()]);
                return null;
            }
        });
    }
}
