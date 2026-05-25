<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Collection;

/**
 * Servicio Central de Configuración de Plataformas (Fase 1)
 * 
 * Proporciona acceso centralizado a todas las configuraciones de redes sociales.
 * Este es el punto único de acceso para obtener configuraciones.
 * 
 * USO:
 * - $service->getPlatforms() - Todas las plataformas
 * - $service->getPlatform('facebook') - Plataforma específica
 * - $service->getContentTypes() - Todos los tipos de contenido
 * - $service->getMediaSpecs('facebook') - Specs de medios
 * - $service->getPublishingRules('facebook') - Reglas de publicación
 * - $service->getCapabilities('pro', 'instagram') - Capacidades
 * - $service->getAPILimits('youtube') - Límites de API
 * - $service->getFeatureFlags('facebook') - Feature flags
 */
class PlatformConfigurationService
{
    /**
     * Cache de configuraciones cargadas
     */
    private array $cache = [];

    /**
     * Obtiene el registry completo de plataformas
     */
    public function getPlatforms(): array
    {
        return $this->loadConfig('platform-registry', 'platforms');
    }

    /**
     * Obtiene una plataforma específica
     */
    public function getPlatform(string $key): ?array
    {
        $platforms = $this->getPlatforms();
        return $platforms[$key] ?? null;
    }

    /**
     * Obtiene todos los tipos de contenido
     */
    public function getContentTypes(): array
    {
        return $this->loadConfig('platform-registry', 'content_types');
    }

    /**
     * Obtiene tipos de contenido permitidos para una plataforma
     */
    public function getContentTypesForPlatform(string $platformKey): array
    {
        $contentTypes = $this->getContentTypes();
        return array_filter(
            $contentTypes,
            fn($type) => in_array($platformKey, $type['platforms'] ?? [])
        );
    }

    /**
     * Obtiene especificaciones de medios para una plataforma
     */
    public function getMediaSpecs(string $platformKey): ?array
    {
        $specs = $this->loadConfig('platform-media-specs');
        return $specs[$platformKey] ?? null;
    }

    /**
     * Obtiene especificaciones de un tipo de medio específico
     */
    public function getMediaSpecsForType(string $platformKey, string $mediaType): ?array
    {
        $specs = $this->getMediaSpecs($platformKey);
        return $specs[$mediaType] ?? null;
    }

    /**
     * Obtiene reglas de publicación para una plataforma
     */
    public function getPublishingRules(string $platformKey): ?array
    {
        $rules = $this->loadConfig('platform-publishing-rules');
        return $rules[$platformKey] ?? null;
    }

    /**
     * Obtiene capacidades por plan para una plataforma
     */
    public function getCapabilities(string $planKey, string $platformKey = null): ?array
    {
        $capabilities = $this->loadConfig('platform-capabilities');
        
        if (!isset($capabilities[$planKey])) {
            return null;
        }

        $planCaps = $capabilities[$planKey];
        
        // Si no se especifica plataforma, retornar todas las capacidades del plan
        if ($platformKey === null) {
            return $planCaps;
        }

        // Si es admin, puede acceder a todas las plataformas
        if ($planKey === 'admin' && isset($planCaps['all_platforms'])) {
            return $planCaps['all_platforms'];
        }

        return $planCaps[$platformKey] ?? null;
    }

    /**
     * Obtiene límites de API para una plataforma
     */
    public function getAPILimits(string $platformKey): ?array
    {
        $limits = $this->loadConfig('platform-api-limits');
        return $limits[$platformKey] ?? null;
    }

    /**
     * Obtiene feature flags para una plataforma
     */
    public function getFeatureFlags(string $platformKey): ?array
    {
        $flags = $this->loadConfig('platform-feature-flags');
        return $flags[$platformKey] ?? null;
    }

    /**
     * Obtiene feature flags globales
     */
    public function getGlobalFeatureFlags(): ?array
    {
        $flags = $this->loadConfig('platform-feature-flags');
        return $flags['global'] ?? null;
    }

    /**
     * Verifica si una plataforma está activa
     */
    public function isPlatformActive(string $platformKey): bool
    {
        $platform = $this->getPlatform($platformKey);
        return $platform['active'] ?? false;
    }

    /**
     * Obtiene todas las plataformas activas
     */
    public function getActivePlatforms(): array
    {
        return array_filter(
            $this->getPlatforms(),
            fn($platform) => $platform['active'] ?? false
        );
    }

    /**
     * Verifica si una plataforma soporta un tipo de contenido específico
     */
    public function platformSupportsContentType(string $platformKey, string $contentType): bool
    {
        $contentTypes = $this->getContentTypes();
        $contentTypeConfig = $contentTypes[$contentType] ?? null;
        
        if (!$contentTypeConfig) {
            return false;
        }

        return in_array($platformKey, $contentTypeConfig['platforms'] ?? []);
    }

    /**
     * Obtiene plataformas que soportan un tipo de contenido específico
     */
    public function getPlatformsForContentType(string $contentType): array
    {
        $contentTypes = $this->getContentTypes();
        $contentTypeConfig = $contentTypes[$contentType] ?? null;
        
        if (!$contentTypeConfig) {
            return [];
        }

        return $contentTypeConfig['platforms'] ?? [];
    }

    /**
     * Verifica si una característica está habilitada
     */
    public function isFeatureEnabled(string $platformKey, string $featurePath): bool
    {
        $flags = $this->getFeatureFlags($platformKey);
        if (!$flags) {
            return false;
        }

        // Soporta rutas anidadas: "publishing.scheduled_publishing"
        $parts = explode('.', $featurePath);
        $current = $flags;

        foreach ($parts as $part) {
            if (!isset($current[$part])) {
                return false;
            }
            $current = $current[$part];
        }

        return $current === true;
    }

    /**
     * Obtiene información de una plataforma de forma completa
     */
    public function getPlatformComplete(string $platformKey): array
    {
        return [
            'platform' => $this->getPlatform($platformKey),
            'content_types' => $this->getContentTypesForPlatform($platformKey),
            'media_specs' => $this->getMediaSpecs($platformKey),
            'publishing_rules' => $this->getPublishingRules($platformKey),
            'api_limits' => $this->getAPILimits($platformKey),
            'feature_flags' => $this->getFeatureFlags($platformKey),
        ];
    }

    /**
     * Carga una configuración usando caché
     */
    private function loadConfig(string $configFile, string $key = null): array|null
    {
        $cacheKey = "{$configFile}.{$key}";
        
        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }

        try {
            $config = Config::get($configFile);
            
            if ($key !== null && isset($config[$key])) {
                $this->cache[$cacheKey] = $config[$key];
                return $config[$key];
            }

            $this->cache[$cacheKey] = $config;
            return $config;
        } catch (\Exception $e) {
            logger()->error("Failed to load platform config: {$configFile}.{$key}", [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Limpia el caché (útil para testing)
     */
    public function clearCache(): void
    {
        $this->cache = [];
    }

    /**
     * Obtiene estadísticas sobre la configuración
     */
    public function getConfigurationStats(): array
    {
        return [
            'platforms_total' => count($this->getPlatforms()),
            'platforms_active' => count($this->getActivePlatforms()),
            'content_types_total' => count($this->getContentTypes()),
            'config_version' => Config::get('platform-registry.version'),
            'last_updated' => Config::get('platform-registry.last_updated'),
        ];
    }
}
