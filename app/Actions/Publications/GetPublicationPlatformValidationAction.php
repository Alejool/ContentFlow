<?php

namespace App\Actions\Publications;

use App\Models\Publications\Publication;
use App\Models\Social\SocialAccount;
use App\Services\PlatformConfigurationService;
use App\Services\ContentValidator;

/**
 * INTEGRACIÓN: Acción para obtener validación de plataformas para una publicación
 * 
 * Retorna información clara sobre qué plataformas soportan el tipo de contenido
 * y cuáles no, con razones específicas.
 */
class GetPublicationPlatformValidationAction
{
    private PlatformConfigurationService $configService;
    private ContentValidator $validator;

    public function __construct(
        PlatformConfigurationService $configService,
        ContentValidator $validator
    ) {
        $this->configService = $configService;
        $this->validator = $validator;
    }

    /**
     * Obtiene validación de plataformas para una publicación
     * 
     * @param Publication|null $publication
     * @param string $contentType
     * @param array $socialAccountIds
     * @return array
     */
    public function execute(
        ?Publication $publication,
        string $contentType,
        array $socialAccountIds = []
    ): array {
        // Obtener cuentas y plataformas
        $socialAccounts = SocialAccount::whereIn('id', $socialAccountIds)->get();
        $platforms = $socialAccounts->pluck('platform')->unique()->toArray();
        
        // Usuario y plan
        $user = auth()->user();
        $userPlan = $user->getActivePlan() ?? 'free';

        $platformValidations = [];
        $compatiblePlatforms = [];
        $incompatiblePlatforms = [];

        foreach ($platforms as $platform) {
            // Validar compatibilidad de tipo de contenido
            $contentValidation = $this->validator->validateForPlatform(
                $platform,
                $contentType,
                $platforms
            );

            // Validar capacidades de usuario
            $hasCapability = $this->configService->hasCapability(
                $userPlan,
                $platform,
                'can_publish'
            );

            $isEditable = true;
            $editReasons = [];

            // Si es publicación existente publicada, no es editable
            if ($publication && $publication->isPublishedOrScheduled()) {
                $isEditable = false;
                $editReasons[] = 'Publicación activa - no editable';
            }

            // Construir información de validación
            $validation = [
                'platform' => $platform,
                'platform_label' => $this->getPlatformLabel($platform),
                'compatible' => $contentValidation['compatible'] && $hasCapability,
                'reasons' => [],
                'is_editable' => $isEditable,
                'edit_reasons' => $editReasons,
                'capabilities' => $this->getCapabilitiesForPlatform($userPlan, $platform),
            ];

            // Razones de incompatibilidad
            if (!$contentValidation['compatible']) {
                $validation['reasons'][] = "Tipo de contenido '{$contentType}' no soportado";
            }

            if (!$hasCapability) {
                $validation['reasons'][] = "Tu plan '{$userPlan}' no permite publicar en {$platform}";
            }

            // Especificaciones técnicas si es compatible
            if ($validation['compatible']) {
                $validation['specs'] = $this->getMediaSpecsForContentType($platform, $contentType);
                $validation['rules'] = $this->getPublishingRules($platform, $contentType);
                $compatiblePlatforms[] = $platform;
            } else {
                $incompatiblePlatforms[] = $platform;
            }

            $platformValidations[$platform] = $validation;
        }

        return [
            'can_publish_to_any' => !empty($compatiblePlatforms),
            'compatible_count' => count($compatiblePlatforms),
            'incompatible_count' => count($incompatiblePlatforms),
            'compatible_platforms' => $compatiblePlatforms,
            'incompatible_platforms' => $incompatiblePlatforms,
            'platforms' => $platformValidations,
            'user_plan' => $userPlan,
            'content_type' => $contentType,
            'is_published' => $publication?->isPublishedOrScheduled() ?? false,
            'publication_id' => $publication?->id,
        ];
    }

    /**
     * Obtiene especificaciones de media para tipo de contenido
     */
    private function getMediaSpecsForContentType(string $platform, string $contentType): array
    {
        $specs = $this->configService->getMediaSpecsForPlatform($platform);
        $rules = $this->configService->getPublishingRulesForContent($platform, $contentType);

        return [
            'video' => $specs['video'] ?? null,
            'image' => $specs['image'] ?? null,
            'media_rules' => $rules['media'] ?? null,
        ];
    }

    /**
     * Obtiene reglas de publicación
     */
    private function getPublishingRules(string $platform, string $contentType): array
    {
        return $this->configService->getPublishingRulesForContent($platform, $contentType) ?? [];
    }

    /**
     * Obtiene capacidades para plataforma y plan
     */
    private function getCapabilitiesForPlatform(string $userPlan, string $platform): array
    {
        $capabilities = $this->configService->getCapabilitiesForPlan($userPlan);
        return $capabilities[$platform] ?? [];
    }

    /**
     * Obtiene etiqueta legible de plataforma
     */
    private function getPlatformLabel(string $platform): string
    {
        $labels = [
            'facebook' => 'Facebook',
            'instagram' => 'Instagram',
            'youtube' => 'YouTube',
            'twitter' => 'X (Twitter)',
            'tiktok' => 'TikTok',
            'linkedin' => 'LinkedIn',
            'threads' => 'Threads',
        ];

        return $labels[$platform] ?? ucfirst($platform);
    }
}
