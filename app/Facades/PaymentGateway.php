<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * Facade para PaymentGatewayFactory
 * 
 * Proporciona acceso estático al Factory de gateways de pago.
 * 
 * @method static \App\Services\Payment\PaymentGatewayInterface make(string $gatewayName)
 * @method static \App\Services\Payment\PaymentGatewayInterface getGatewayForCountry(string $countryCode)
 * @method static array getAvailableGateways()
 * @method static array getGatewaysForCountry(string $countryCode)
 * 
 * @see \App\Services\Payment\PaymentGatewayFactory
 */
class PaymentGateway extends Facade
{
    /**
     * Obtener el nombre registrado del componente en el contenedor
     *
     * @return string
     */
    protected static function getFacadeAccessor(): string
    {
        return \App\Services\Payment\PaymentGatewayFactory::class;
    }
}
