<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * Facade para CountryDetectionService
 * 
 * Proporciona acceso estático al servicio de detección de país.
 * 
 * @method static string detectCountry(?\App\Models\User $user = null, ?string $ipAddress = null)
 * @method static string getCurrencyForCountry(string $countryCode)
 * @method static float getExchangeRate(string $currency)
 * @method static array convertPrice(float $priceUSD, string $countryCode)
 * 
 * @see \App\Services\Payment\CountryDetectionService
 */
class CountryDetection extends Facade
{
    /**
     * Obtener el nombre registrado del componente en el contenedor
     *
     * @return string
     */
    protected static function getFacadeAccessor(): string
    {
        return \App\Services\Payment\CountryDetectionService::class;
    }
}
