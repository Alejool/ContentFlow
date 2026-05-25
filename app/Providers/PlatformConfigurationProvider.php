<?php

namespace App\Providers;

use App\Services\PlatformConfigurationService;
use App\Services\ContentValidator;
use App\Services\MediaValidator;
use App\Services\Validation\SocialMediaLimitsService;
use Illuminate\Support\ServiceProvider;

/**
 * Provider para registrar los servicios de configuración de plataformas
 * en el contenedor de inyección de dependencias.
 * 
 * FASE 4: Registra servicios refactorizados
 */
class PlatformConfigurationProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Registrar el servicio de configuración como singleton
        $this->app->singleton(PlatformConfigurationService::class, function ($app) {
            return new PlatformConfigurationService();
        });

        // Registrar el validador de medios
        $this->app->singleton(MediaValidator::class, function ($app) {
            return new MediaValidator(
                $app->make(PlatformConfigurationService::class)
            );
        });

        // Registrar el validador de contenido
        $this->app->singleton(ContentValidator::class, function ($app) {
            return new ContentValidator(
                $app->make(PlatformConfigurationService::class),
                $app->make(MediaValidator::class)
            );
        });

        // Refactorizar SocialMediaLimitsService para usar los nuevos servicios
        $this->app->bind(SocialMediaLimitsService::class, function ($app) {
            return new SocialMediaLimitsService(
                $app->make(PlatformConfigurationService::class),
                $app->make(ContentValidator::class)
            );
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Aquí se puede agregar lógica de boot si es necesaria
    }
}
