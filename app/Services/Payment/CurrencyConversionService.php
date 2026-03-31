<?php

namespace App\Services\Payment;

use App\Models\User;
use App\Models\Workspace\Workspace;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Servicio de Conversión de Moneda
 * 
 * Convierte precios USD a moneda local según el país del usuario/workspace
 */
class CurrencyConversionService
{
    private CountryDetectionService $countryDetection;

    public function __construct(CountryDetectionService $countryDetection)
    {
        $this->countryDetection = $countryDetection;
    }

    /**
     * Convertir precio USD a moneda local del workspace/usuario
     */
    public function convertPrice(
        float $usdPrice,
        ?Workspace $workspace = null,
        ?User $user = null
    ): array {
        $countryCode = $this->detectCountry($workspace, $user);
        $currency = $this->getCurrency($countryCode);
        $exchangeRate = $this->getExchangeRate($currency);
        
        $localPrice = $this->calculateLocalPrice($usdPrice, $exchangeRate);

        return [
            'usd_price' => $usdPrice,
            'local_price' => $localPrice,
            'currency' => $currency,
            'country' => $countryCode,
            'exchange_rate' => $exchangeRate,
            'formatted' => $this->formatPrice($localPrice, $currency),
        ];
    }

    /**
     * Convertir múltiples precios (para addons)
     */
    public function convertPrices(
        array $items,
        ?Workspace $workspace = null,
        ?User $user = null,
        string $priceKey = 'price'
    ): array {
        $countryCode = $this->detectCountry($workspace, $user);
        $currency = $this->getCurrency($countryCode);
        $exchangeRate = $this->getExchangeRate($currency);

        return array_map(function ($item) use ($exchangeRate, $currency, $priceKey) {
            $usdPrice = $item[$priceKey] ?? 0;
            $localPrice = $this->calculateLocalPrice($usdPrice, $exchangeRate);

            return array_merge($item, [
                'price_usd' => $usdPrice,
                'price_local' => $localPrice,
                'currency' => $currency,
                'exchange_rate' => $exchangeRate,
                'formatted_price' => $this->formatPrice($localPrice, $currency),
            ]);
        }, $items);
    }

    /**
     * Detectar país del workspace o usuario
     */
    private function detectCountry(?Workspace $workspace, ?User $user): string
    {
        // 1. Prioridad: País del workspace
        if ($workspace && $workspace->country) {
            return strtoupper($workspace->country);
        }

        // 2. País del usuario
        if ($user && $user->country) {
            return strtoupper($user->country);
        }

        // 3. Usar servicio de detección de país
        try {
            return $this->countryDetection->detectCountry();
        } catch (\Exception $e) {
            Log::warning('Error detecting country: ' . $e->getMessage());
        }

        // 4. Fallback a US
        return 'US';
    }

    /**
     * Obtener moneda para un país
     */
    private function getCurrency(string $countryCode): string
    {
        $currencies = config('payment.currencies', []);
        
        // Si el país está en la zona euro
        $euroCountries = ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'IE', 'GR', 'FI', 'SK', 'SI', 'CY', 'MT', 'LU', 'EE', 'LV', 'LT'];
        if (in_array($countryCode, $euroCountries)) {
            return 'EUR';
        }

        return $currencies[$countryCode] ?? 'USD';
    }

    /**
     * Obtener tasa de cambio (con caché y API externa)
     */
    private function getExchangeRate(string $currency): float
    {
        if ($currency === 'USD') {
            return 1.0;
        }

        // Intentar obtener de API externa (con caché de 1 hora)
        $cacheKey = "exchange_rate_{$currency}";
        
        return Cache::remember($cacheKey, 3600, function () use ($currency) {
            // Intentar API externa
            $apiRate = $this->fetchExchangeRateFromApi($currency);
            if ($apiRate) {
                return $apiRate;
            }

            // Fallback: usar tasas configuradas
            $rates = config('payment.exchange_rates', []);
            return $rates[$currency] ?? 1.0;
        });
    }

    /**
     * Obtener tasa de cambio desde API externa
     */
    private function fetchExchangeRateFromApi(string $currency): ?float
    {
        try {
            // Usar API gratuita de exchangerate-api.com
            // Puedes cambiar a otra API como fixer.io, currencyapi.com, etc.
            $apiKey = env('EXCHANGE_RATE_API_KEY');
            
            if (!$apiKey) {
                return null; // Sin API key, usar fallback
            }

            $response = Http::timeout(5)->get("https://v6.exchangerate-api.com/v6/{$apiKey}/latest/USD");

            if ($response->successful()) {
                $data = $response->json();
                return $data['conversion_rates'][$currency] ?? null;
            }
        } catch (\Exception $e) {
            Log::warning("Error fetching exchange rate for {$currency}: {$e->getMessage()}");
        }

        return null;
    }

    /**
     * Calcular precio local con redondeo inteligente
     */
    private function calculateLocalPrice(float $usdPrice, float $exchangeRate): float
    {
        $localPrice = $usdPrice * $exchangeRate;

        // Redondeo inteligente según la moneda
        if ($exchangeRate > 100) {
            // Monedas con valores altos (COP, CLP, JPY): redondear a enteros
            return round($localPrice, 0);
        } elseif ($exchangeRate > 10) {
            // Monedas medianas (MXN): redondear a 1 decimal
            return round($localPrice, 1);
        } else {
            // Monedas bajas (USD, EUR, GBP): redondear a 2 decimales
            return round($localPrice, 2);
        }
    }

    /**
     * Formatear precio con símbolo de moneda
     */
    public function formatPrice(float $price, string $currency): string
    {
        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'COP' => '$',
            'MXN' => '$',
            'ARS' => '$',
            'BRL' => 'R$',
            'CLP' => '$',
            'PEN' => 'S/',
            'CAD' => 'CA$',
            'AUD' => 'A$',
            'JPY' => '¥',
            'INR' => '₹',
        ];

        $symbol = $symbols[$currency] ?? $currency . ' ';
        
        // Formatear según la moneda
        if (in_array($currency, ['COP', 'CLP', 'JPY'])) {
            // Sin decimales
            return $symbol . number_format($price, 0, '.', ',');
        } else {
            // Con decimales
            return $symbol . number_format($price, 2, '.', ',');
        }
    }

    /**
     * Actualizar tasas de cambio manualmente (comando artisan)
     */
    public function updateExchangeRates(): array
    {
        $currencies = array_keys(config('payment.exchange_rates', []));
        $updated = [];

        foreach ($currencies as $currency) {
            $rate = $this->fetchExchangeRateFromApi($currency);
            if ($rate) {
                Cache::put("exchange_rate_{$currency}", $rate, 3600);
                $updated[$currency] = $rate;
            }
        }

        return $updated;
    }

    /**
     * Limpiar caché de tasas de cambio
     */
    public function clearExchangeRateCache(): void
    {
        $currencies = array_keys(config('payment.exchange_rates', []));
        
        foreach ($currencies as $currency) {
            Cache::forget("exchange_rate_{$currency}");
        }
    }
}
