<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Payment\PaymentGatewayFactory;
use App\Services\Payment\PaymentGatewayInterface;
use App\Services\Payment\CountryDetectionService;
use App\Services\Payment\CurrencyConversionService;

/**
 * Service Provider para servicios de pago
 * 
 * Registra todos los servicios de pago como Singletons para optimizar
 * el uso de recursos y mantener estado consistente durante el request.
 */
class PaymentServiceProvider extends ServiceProvider
{
    /**
     * Register payment services as Singletons
     */
    public function register(): void
    {
        // Factory principal como Singleton
        // Una única instancia gestiona todos los gateways
        $this->app->singleton(PaymentGatewayFactory::class);
        
        // Servicios auxiliares como Singletons
        // Estos servicios mantienen caché y estado durante el request
        $this->app->singleton(CountryDetectionService::class);
        $this->app->singleton(CurrencyConversionService::class);
        
        // Gateways individuales como Singletons
        // Cada gateway mantiene su configuración y conexiones HTTP
        $this->app->singleton(\App\Services\Payment\Gateways\StripeGateway::class);
        $this->app->singleton(\App\Services\Payment\Gateways\MercadoPagoManualGateway::class);
        $this->app->singleton(\App\Services\Payment\Gateways\WompiGateway::class);
        $this->app->singleton(\App\Services\Payment\Gateways\PayUGateway::class);
        $this->app->singleton(\App\Services\Payment\Gateways\EpaycoGateway::class);
        
        // Binding condicional: resolver gateway según contexto del usuario
        // Esto permite inyectar PaymentGatewayInterface y obtener el gateway correcto
        $this->app->bind(PaymentGatewayInterface::class, function ($app) {
            // Obtener el servicio de detección de país
            $countryDetection = $app->make(CountryDetectionService::class);
            
            // Detectar país del usuario actual (si existe)
            $user = auth()->user();
            $ipAddress = request()->ip();
            $countryCode = $countryDetection->detectCountry($user, $ipAddress);
            
            // Retornar el gateway apropiado para el país
            return PaymentGatewayFactory::getGatewayForCountry($countryCode);
        });
    }

    /**
     * Bootstrap payment services
     */
    public function boot(): void
    {
        // Aquí puedes registrar listeners, observers, etc.
        // Por ejemplo, listeners para webhooks de diferentes gateways
    }
}
