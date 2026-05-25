<?php

namespace App\Services;

use App\Services\PlatformConfigurationService;
use App\Services\Validation\SocialMediaLimitsService;

/**
 * FASE 9: Migración - Facade de compatibilidad
 * 
 * Proporciona métodos para migrar código legacy de forma gradual.
 * Este servicio wrappea la nueva configuración centralizada.
 */
class LegacyCompatibilityFacade
{
    private PlatformConfigurationService $configService;
    private ContentValidator $validator;
    private SocialMediaLimitsService $limitsService;

    public function __construct(
        PlatformConfigurationService $configService,
        ContentValidator $validator,
        SocialMediaLimitsService $limitsService
    ) {
        $this->configService = $configService;
        $this->validator = $validator;
        $this->limitsService = $limitsService;
    }

    /**
     * Obtiene límites de plataforma (compatibilidad con código antiguo)
     * @deprecated Usar PlatformConfigurationService directamente
     */
    public function getPlatformLimits(string $platform): array
    {
        return $this->configService->getMediaSpecsForPlatform($platform);
    }

    /**
     * Obtiene capacidades de usuario (compatibilidad con código antiguo)
     * @deprecated Usar PlatformConfigurationService::getCapabilitiesForPlan
     */
    public function getUserCapabilities(string $userPlan, string $platform): array
    {
        return $this->configService->getCapabilitiesForPlan($userPlan)[$platform] ?? [];
    }

    /**
     * Valida publicación (compatibilidad con código antiguo)
     * @deprecated Usar ContentValidator::validateForPlatform
     */
    public function validatePublication(array $publication, array $platforms): array
    {
        $results = [];
        foreach ($platforms as $platform) {
            $results[$platform] = $this->validator->validateForPlatform(
                $platform,
                $publication['content_type'] ?? 'post',
                $platforms
            );
        }
        return $results;
    }

    /**
     * Obtiene tipos de contenido (compatibilidad con código antiguo)
     * @deprecated Usar PlatformConfigurationService::getContentTypesForPlatform
     */
    public function getContentTypes(string $platform): array
    {
        return $this->configService->getContentTypesForPlatform($platform);
    }

    /**
     * Mapea datos antiguos a nuevos (helper para migración)
     */
    public static function migratePublicationData(array $oldData): array
    {
        return [
            'content_type' => $oldData['type'] ?? 'post',
            'platforms' => $oldData['social_networks'] ?? [],
            'text' => $oldData['content'] ?? '',
            'media' => $oldData['attachments'] ?? [],
            'schedule_at' => $oldData['scheduled_at'] ?? null,
        ];
    }
}
