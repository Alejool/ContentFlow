<?php

namespace App\Services\Payment;

use App\Services\Payment\Gateways\StripeGateway;
use App\Services\Payment\Gateways\MercadoPagoGateway;
use App\Services\Payment\Gateways\MercadoPagoManualGateway;
use App\Services\Payment\Gateways\EpaycoGateway;
use App\Services\Payment\Gateways\PayUGateway;
use App\Services\Payment\Gateways\WompiGateway;
use Illuminate\Support\Facades\Log;

/**
 * Factory para crear instancias de gateways de pago
 */
class PaymentGatewayFactory
{
    private static array $gateways = [
        'stripe' => StripeGateway::class,
        'mercadopago' => MercadoPagoManualGateway::class, // Usando implementación manual
        'epayco' => EpaycoGateway::class,
        'payu' => PayUGateway::class,
        'wompi' => WompiGateway::class,
    ];

    /**
     * Obtener gateway según país del usuario
     */
    public static function getGatewayForCountry(string $countryCode): PaymentGatewayInterface
    {
        $gatewayName = self::determineGateway($countryCode);
        return self::make($gatewayName);
    }

    /**
     * Crear instancia de gateway específico
     */
    public static function make(string $gatewayName): PaymentGatewayInterface
    {
        if (!isset(self::$gateways[$gatewayName])) {
            Log::warning("Gateway {$gatewayName} not found, falling back to Stripe");
            $gatewayName = 'stripe';
        }

        $gatewayClass = self::$gateways[$gatewayName];
        
        try {
            $gateway = app($gatewayClass);

            if (!$gateway->isAvailable()) {
                Log::warning("Gateway {$gatewayName} not available (credentials missing)");
                
                // Si no es Stripe, intentar con Stripe como fallback
                if ($gatewayName !== 'stripe') {
                    Log::info("Falling back to Stripe");
                    return app(StripeGateway::class);
                }
            }

            return $gateway;
        } catch (\Exception $e) {
            Log::error("Failed to instantiate gateway {$gatewayName}", [
                'error' => $e->getMessage(),
            ]);
            
            // Fallback a Stripe
            if ($gatewayName !== 'stripe') {
                Log::info("Falling back to Stripe due to error");
                return app(StripeGateway::class);
            }
            
            throw $e;
        }
    }

    /**
     * Determinar qué gateway usar según el país
     */
    private static function determineGateway(string $countryCode): string
    {
        $countryGateways = config('payment.country_gateways', []);
        
        // Buscar gateway específico para el país
        if (isset($countryGateways[$countryCode])) {
            return $countryGateways[$countryCode];
        }

        // Verificar si el país está en la lista de Stripe
        $stripeCountries = config('payment.stripe_countries', []);
        if (in_array($countryCode, $stripeCountries)) {
            return 'stripe';
        }

        // Default: Stripe
        return 'stripe';
    }

    /**
     * Obtener todos los gateways disponibles
     */
    public static function getAvailableGateways(): array
    {
        $available = [];
        
        foreach (self::$gateways as $name => $class) {
            $gateway = app($class);
            if ($gateway->isAvailable()) {
                $available[$name] = $gateway;
            }
        }

        return $available;
    }

    /**
     * Obtener gateways disponibles para un país
     */
    public static function getGatewaysForCountry(string $countryCode): array
    {
        $countryGateways = config('payment.country_gateways_multiple', []);
        
        if (isset($countryGateways[$countryCode])) {
            $gateways = [];
            foreach ($countryGateways[$countryCode] as $gatewayName) {
                if (isset(self::$gateways[$gatewayName])) {
                    $gateway = app(self::$gateways[$gatewayName]);
                    if ($gateway->isAvailable()) {
                        $gateways[$gatewayName] = $gateway;
                    }
                }
            }
            return $gateways;
        }

        // Default: solo Stripe
        return ['stripe' => app(StripeGateway::class)];
    }
}
