<?php

namespace App\Services\Payment;

use App\Integrations\GeoIp\IpApiClient;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Servicio para detectar el país del usuario
 */
class CountryDetectionService
{
    /**
     * Detectar país del usuario usando múltiples métodos
     */
    public function detectCountry(?User $user = null, ?string $ipAddress = null): string
    {
        $methods = config('payment.country_detection.methods', ['user_profile', 'ip_geolocation']);

        foreach ($methods as $method) {
            $country = match ($method) {
                'user_profile' => $this->fromUserProfile($user),
                'ip_geolocation' => $this->fromIpGeolocation($ipAddress),
                'browser_locale' => $this->fromBrowserLocale(),
                default => null,
            };

            if ($country) {
                Log::info('Country detected', [
                    'method' => $method,
                    'country' => $country,
                    'user_id' => $user?->id,
                ]);
                return $country;
            }
        }

        // Fallback al país por defecto
        $defaultCountry = config('payment.country_detection.default_country', 'US');
        
        Log::info('Using default country', [
            'country' => $defaultCountry,
            'user_id' => $user?->id,
        ]);

        return $defaultCountry;
    }

    /**
     * Obtener país desde el perfil del usuario
     * Prioridad: 1. Usuario, 2. Workspace actual
     */
    private function fromUserProfile(?User $user): ?string
    {
        if (!$user) {
            return null;
        }

        // 1. PRIORIDAD: Verificar si el usuario tiene país en su perfil
        if (!empty($user->country)) {
            Log::debug('Country from user profile', [
                'user_id' => $user->id,
                'country' => $user->country,
            ]);
            return strtoupper($user->country);
        }

        // 2. FALLBACK: Verificar en el workspace actual del usuario
        // Cargar la relación si no está cargada
        if (!$user->relationLoaded('currentWorkspace')) {
            $user->load('currentWorkspace');
        }

        $workspace = $user->currentWorkspace;
        if ($workspace && !empty($workspace->country)) {
            Log::debug('Country from workspace', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
                'country' => $workspace->country,
            ]);
            return strtoupper($workspace->country);
        }

        return null;
    }

    /**
     * Obtener país desde geolocalización por IP
     */
    private function fromIpGeolocation(?string $ipAddress): ?string
    {
        if (!$ipAddress || $ipAddress === '127.0.0.1' || $ipAddress === '::1') {
            return null;
        }

        // Usar caché para evitar múltiples llamadas a la API
        $cacheKey = "ip_country_{$ipAddress}";
        
        return Cache::remember($cacheKey, now()->addDays(7), function () use ($ipAddress) {
            try {
                $country = app(IpApiClient::class)->lookupCountry($ipAddress);

                if ($country !== null) {
                    return $country;
                }
            } catch (\Exception $e) {
                Log::warning('IP geolocation failed', [
                    'ip' => $ipAddress,
                    'error' => $e->getMessage(),
                ]);
            }

            return null;
        });
    }

    /**
     * Obtener país desde locale del navegador
     */
    private function fromBrowserLocale(): ?string
    {
        $locale = request()->header('Accept-Language');
        
        if (!$locale) {
            return null;
        }

        // Parsear el header Accept-Language
        // Ejemplo: "es-CO,es;q=0.9,en;q=0.8"
        $parts = explode(',', $locale);
        
        foreach ($parts as $part) {
            $langParts = explode('-', trim(explode(';', $part)[0]));
            
            if (count($langParts) === 2) {
                return strtoupper($langParts[1]);
            }
        }

        return null;
    }

    /**
     * Obtener moneda para un país
     */
    public function getCurrencyForCountry(string $countryCode): string
    {
        $currencies = config('payment.currencies', []);
        return $currencies[$countryCode] ?? 'USD';
    }

    /**
     * Obtener tasa de cambio para una moneda
     */
    public function getExchangeRate(string $currency): float
    {
        $rates = config('payment.exchange_rates', []);
        return $rates[$currency] ?? 1.0;
    }

    /**
     * Convertir precio de USD a moneda local
     */
    public function convertPrice(float $usdPrice, string $countryCode): array
    {
        $currency = $this->getCurrencyForCountry($countryCode);
        $rate = $this->getExchangeRate($currency);
        $localPrice = round($usdPrice * $rate, 2);

        return [
            'usd' => $usdPrice,
            'local' => $localPrice,
            'currency' => $currency,
            'rate' => $rate,
        ];
    }
}
