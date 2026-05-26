<?php

namespace App\Services;

/**
 * Validador Central de Contenido
 * 
 * Valida que el contenido cumpla con las reglas de cada plataforma.
 * Proporciona feedback detallado sobre qué plataformas son compatibles
 * y cuáles no (con motivos específicos).
 * 
 * USO:
 * $validator = new ContentValidator($configService);
 * $result = $validator->validate($publication, ['facebook', 'instagram']);
 * 
 * Retorna:
 * [
 *     'facebook' => [
 *         'compatible' => true,
 *         'warnings' => [...],
 *     ],
 *     'instagram' => [
 *         'compatible' => false,
 *         'errors' => ['Duration exceeds 90 seconds limit'],
 *         'reason' => 'MEDIA_DURATION_EXCEEDS_LIMIT'
 *     ]
 * ]
 */
class ContentValidator
{
    public function __construct(
        private PlatformConfigurationService $configService,
        private MediaValidator $mediaValidator,
    ) {}

    /**
     * Valida contenido contra una lista de plataformas
     */
    public function validate(
        object $publication,
        array $platformKeys,
        ?string $userPlan = 'free'
    ): array {
        $results = [];

        foreach ($platformKeys as $platformKey) {
            $results[$platformKey] = $this->validateForPlatform(
                $publication,
                $platformKey,
                $userPlan
            );
        }

        return $results;
    }

    /**
     * Valida contenido para una plataforma específica
     */
    public function validateForPlatform(
        object $publication,
        string $platformKey,
        ?string $userPlan = 'free'
    ): array {
        // 1. Verificar si la plataforma está activa
        if (!$this->configService->isPlatformActive($platformKey)) {
            return [
                'compatible' => false,
                'errors' => ['Platform is not active'],
                'reason' => 'PLATFORM_INACTIVE',
            ];
        }

        // 2. Validar capacidades del usuario
        $capabilities = $this->configService->getCapabilities($userPlan, $platformKey);
        if (!$capabilities || !($capabilities['can_publish'] ?? false)) {
            return [
                'compatible' => false,
                'errors' => ['Your plan does not support publishing to this platform'],
                'reason' => 'USER_PLAN_NOT_SUPPORTED',
            ];
        }

        // 3. Validar tipo de contenido
        $contentType = $publication->content_type ?? 'post';
        if (!$this->configService->platformSupportsContentType($platformKey, $contentType)) {
            return [
                'compatible' => false,
                'errors' => ["Content type '{$contentType}' not supported"],
                'reason' => 'CONTENT_TYPE_NOT_SUPPORTED',
            ];
        }

        // 4. Validar medios
        $mediaErrors = $this->mediaValidator->validateMedia(
            $publication,
            $platformKey,
            $capabilities
        );
        if (!empty($mediaErrors['errors'])) {
            return [
                'compatible' => false,
                'errors' => $mediaErrors['errors'],
                'reason' => 'MEDIA_VALIDATION_FAILED',
            ];
        }

        // 5. Validar reglas de publicación
        $ruleErrors = $this->validatePublishingRules(
            $publication,
            $platformKey
        );
        if (!empty($ruleErrors)) {
            return [
                'compatible' => false,
                'errors' => $ruleErrors,
                'reason' => 'PUBLISHING_RULES_VIOLATION',
            ];
        }

        return [
            'compatible' => true,
            'warnings' => $mediaErrors['warnings'] ?? [],
            'capabilities' => $capabilities,
        ];
    }

    /**
     * Valida reglas de publicación específicas de cada plataforma
     */
    private function validatePublishingRules(
        object $publication,
        string $platformKey
    ): array {
        $errors = [];
        $rules = $this->configService->getPublishingRules($platformKey);
        
        if (!$rules) {
            return $errors;
        }

        // Validar límites de texto
        if (isset($rules['text'])) {
            $textLength = strlen($publication->description ?? '');
            
            if ($textLength > ($rules['text']['max_length'] ?? PHP_INT_MAX)) {
                $errors[] = sprintf(
                    'Text exceeds %d character limit (%d characters used)',
                    $rules['text']['max_length'],
                    $textLength
                );
            }

            if ($textLength < ($rules['text']['min_length'] ?? 0)) {
                $errors[] = sprintf(
                    'Text must be at least %d characters',
                    $rules['text']['min_length']
                );
            }

            // Validar URLs si no están permitidas
            if (!($rules['text']['urls_allowed'] ?? true)) {
                if (preg_match('~https?://~', $publication->description ?? '')) {
                    $errors[] = 'URLs are not allowed in text';
                }
            }
        }

        // Validar combinaciones de medios
        if (isset($rules['media'])) {
            $hasVideo = false;
            $hasImage = false;

            // Normalize mediaFiles to plain array once
            $mediaFiles = $publication->mediaFiles ?? [];
            if ($mediaFiles instanceof \Illuminate\Support\Collection) {
                $mediaFiles = $mediaFiles->all();
            }

            foreach ($mediaFiles as $media) {
                if ($media->file_type === 'video') {
                    $hasVideo = true;
                } elseif ($media->file_type === 'image') {
                    $hasImage = true;
                }
            }

            // Validar si se permiten múltiples videos
            if ($hasVideo && count(array_filter($mediaFiles, fn($m) => $m->file_type === 'video')) > 1) {
                if (!($rules['media']['multiple_videos_allowed'] ?? false)) {
                    $errors[] = 'Multiple videos are not allowed';
                }
            }

            // Validar si se permite mezclar medios
            if ($hasVideo && $hasImage && !($rules['media']['mixed_media_allowed'] ?? true)) {
                $errors[] = 'Cannot mix videos and images in the same post';
            }
        }

        return $errors;
    }

    /**
     * Obtiene un resumen de compatibilidad de forma amigable
     */
    public function getSummary(array $validationResults): array
    {
        $compatible = [];
        $incompatible = [];
        $warnings = [];

        foreach ($validationResults as $platform => $result) {
            if ($result['compatible'] ?? false) {
                $compatible[] = $platform;
                if (!empty($result['warnings'])) {
                    $warnings[$platform] = $result['warnings'];
                }
            } else {
                $incompatible[] = [
                    'platform' => $platform,
                    'reason' => $result['reason'] ?? 'UNKNOWN',
                    'errors' => $result['errors'] ?? [],
                ];
            }
        }

        return [
            'can_publish_to_any' => !empty($compatible),
            'compatible_count' => count($compatible),
            'incompatible_count' => count($incompatible),
            'compatible_platforms' => $compatible,
            'incompatible_platforms' => $incompatible,
            'warnings' => $warnings,
        ];
    }
}
