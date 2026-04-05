<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * Facade para CurrencyConversionService
 * 
 * Proporciona acceso estático al servicio de conversión de moneda.
 * 
 * @method static float convert(float $amount, string $fromCurrency, string $toCurrency)
 * @method static float getExchangeRate(string $currency)
 * @method static array getSupportedCurrencies()
 * 
 * @see \App\Services\Payment\CurrencyConversionService
 */
class CurrencyConversion extends Facade
{
    /**
     * Obtener el nombre registrado del componente en el contenedor
     *
     * @return string
     */
    protected static function getFacadeAccessor(): string
    {
        return \App\Services\Payment\CurrencyConversionService::class;
    }
}
