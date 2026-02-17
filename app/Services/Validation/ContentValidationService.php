<?php

namespace App\Services\Validation;

use App\DTOs\ContentValidationResultDTO;
use App\DTOs\PlatformValidationResultDTO;
use App\Models\Publications\Publication;
use App\Models\Social\SocialAccount;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ContentValidationService
{
    protected MediaAnalyzer $mediaAnalyzer;

    public function __construct(MediaAnalyzer $mediaAnalyzer)
    {
        $this->mediaAnalyzer = $mediaAnalyzer;
    }

    /**
     * Valida el contenido de una publicación contra las plataformas seleccionadas
     */
    public function validatePublication(Publication $publication, array $platformIds): ContentValidationResultDTO
    {
        $cacheKey = "content_validation_{$publication->id}_" . md5(json_encode($platformIds));
        
        return Cache::remember($cacheKey, 300, function () use ($publication, $platformIds) {
            return $this->performValidation($publication, $platformIds);
        });
    }

    protected function performValidation(Publication $publication, array $platformIds): ContentValidationResultDTO
    {
        $mediaFiles = $publication->mediaFiles;
        
        if ($mediaFiles->isEmpty()) {
            return new ContentValidationResultDTO(
                isValid: true,
                warnings: ['No hay archivos multimedia adjuntos']
            );
        }

        // Obtener cuentas sociales
        $socialAccounts = SocialAccount::whereIn('id', $platformIds)
            ->where('workspace_id', $publication->workspace_id)
            ->get();

        $globalErrors = [];
        $globalWarnings = [];
        $recommendations = [];
        $platformResults = [];
        $allCompatible = true;

        // Analizar cada archivo multimedia
        foreach ($mediaFiles as $mediaFile) {
            $mediaInfo = $this->mediaAnalyzer->analyze($mediaFile);
            
            if (!$mediaInfo) {
                $globalErrors[] = "No se pudo analizar el archivo: {$mediaFile->filename}";
                $allCompatible = false;
                continue;
            }

            // Detectar tipo óptimo de contenido
            $detectedType = $this->detectOptimalContentType($mediaInfo);

            // Validar contra cada plataforma
            foreach ($socialAccounts as $account) {
                $platformResult = $this->validateAgainstPlatform(
                    $mediaInfo,
                    $account->platform,
                    $detectedType,
                    $publication
                );

                $platformResults[$account->platform] = $platformResult->toArray();

                if (!$platformResult->isCompatible) {
                    $allCompatible = false;
                }
            }

            // Generar recomendaciones globales
            $recommendations = array_merge(
                $recommendations,
                $this->generateRecommendations($mediaInfo, $detectedType, $socialAccounts)
            );
        }

        return new ContentValidationResultDTO(
            isValid: $allCompatible,
            errors: $globalErrors,
            warnings: $globalWarnings,
            recommendations: array_unique($recommendations),
            detectedType: $detectedType ?? null,
            platformResults: $platformResults,
            mediaInfo: $mediaInfo ?? null
        );
    }

    /**
     * Valida un archivo contra los requisitos de una plataforma específica
     */
    protected function validateAgainstPlatform(
        array $mediaInfo,
        string $platform,
        ?string $detectedType,
        Publication $publication
    ): PlatformValidationResultDTO {
        $config = config("social_platforms.{$platform}");
        
        if (!$config) {
            return new PlatformValidationResultDTO(
                platform: $platform,
                isCompatible: false,
                errors: ['Plataforma no configurada']
            );
        }

        $mediaType = $mediaInfo['type']; // 'video' or 'image'
        $platformConfig = $config[$mediaType] ?? null;

        if (!$platformConfig) {
            return new PlatformValidationResultDTO(
                platform: $platform,
                isCompatible: false,
                errors: ["Tipo de contenido '{$mediaType}' no soportado"]
            );
        }

        $errors = [];
        $warnings = [];

        // Validar formato
        if (!in_array(strtolower($mediaInfo['extension']), $platformConfig['formats'])) {
            $errors[] = __('validation_messages.errors.format_not_supported', [
                'format' => $mediaInfo['extension'],
                'required' => implode(', ', $platformConfig['formats'])
            ]);
        }

        // Validar tamaño
        $sizeMB = $mediaInfo['size'] / (1024 * 1024);
        if ($sizeMB > $platformConfig['max_size_mb']) {
            $errors[] = __('validation_messages.errors.size_exceeded', [
                'size' => round($sizeMB, 2),
                'max' => $platformConfig['max_size_mb']
            ]);
        }

        if ($mediaType === 'video') {
            $this->validateVideoSpecs($mediaInfo, $platformConfig, $detectedType, $errors, $warnings);
        }

        $isCompatible = empty($errors);
        $recommendedType = $this->getRecommendedType($platform, $mediaInfo, $detectedType);

        return new PlatformValidationResultDTO(
            platform: $platform,
            isCompatible: $isCompatible,
            errors: $errors,
            warnings: $warnings,
            recommendedType: $recommendedType
        );
    }

    /**
     * Valida especificaciones de video
     */
    protected function validateVideoSpecs(
        array $mediaInfo,
        array $platformConfig,
        ?string $detectedType,
        array &$errors,
        array &$warnings
    ): void {
        $duration = $mediaInfo['duration'] ?? 0;
        $aspectRatio = $mediaInfo['aspect_ratio'] ?? null;

        // Determinar configuración según tipo
        $typeConfig = null;
        if (isset($platformConfig['types']) && $detectedType) {
            $typeConfig = $platformConfig['types'][$detectedType] ?? null;
        }

        $activeConfig = $typeConfig ?? $platformConfig;

        // Validar duración
        if (isset($activeConfig['max_duration_seconds']) && $duration > $activeConfig['max_duration_seconds']) {
            $maxMin = floor($activeConfig['max_duration_seconds'] / 60);
            $maxSec = $activeConfig['max_duration_seconds'] % 60;
            $errors[] = "Duración excedida: {$duration}s (máximo: {$maxMin}m {$maxSec}s)";
        }

        if (isset($activeConfig['min_duration_seconds']) && $duration < $activeConfig['min_duration_seconds']) {
            $warnings[] = "Duración muy corta: {$duration}s (mínimo recomendado: {$activeConfig['min_duration_seconds']}s)";
        }

        // Validar aspect ratio
        if (isset($activeConfig['aspect_ratio']) && $aspectRatio) {
            if ($aspectRatio !== $activeConfig['aspect_ratio']) {
                $warnings[] = "Relación de aspecto: {$aspectRatio} (recomendado: {$activeConfig['aspect_ratio']})";
            }
        } elseif (isset($activeConfig['aspect_ratios']) && $aspectRatio) {
            if (!in_array($aspectRatio, $activeConfig['aspect_ratios'])) {
                $warnings[] = "Relación de aspecto: {$aspectRatio} (recomendado: " . 
                             implode(', ', $activeConfig['aspect_ratios']) . ")";
            }
        }

        // Validar resolución
        if (isset($platformConfig['resolutions'])) {
            $width = $mediaInfo['width'] ?? 0;
            $height = $mediaInfo['height'] ?? 0;
            $resConfig = $platformConfig['resolutions'];

            if (isset($resConfig['min_width']) && $width < $resConfig['min_width']) {
                $errors[] = "Ancho mínimo: {$width}px (requerido: {$resConfig['min_width']}px)";
            }
            if (isset($resConfig['max_width']) && $width > $resConfig['max_width']) {
                $warnings[] = "Ancho excedido: {$width}px (máximo: {$resConfig['max_width']}px)";
            }
        }
    }

    /**
     * Detecta el tipo óptimo de contenido basado en características del video
     */
    protected function detectOptimalContentType(array $mediaInfo): ?string
    {
        if ($mediaInfo['type'] !== 'video') {
            return null;
        }

        $duration = $mediaInfo['duration'] ?? 0;
        $aspectRatio = $mediaInfo['aspect_ratio'] ?? null;

        // Detectar Short/Reel (vertical y corto)
        if ($aspectRatio === '9:16' && $duration <= 90) {
            return 'reel'; // o 'short' dependiendo del contexto
        }

        // Detectar video estándar
        if ($aspectRatio === '16:9') {
            return 'standard';
        }

        // Video cuadrado
        if ($aspectRatio === '1:1') {
            return 'feed';
        }

        return 'standard';
    }

    /**
     * Genera recomendaciones basadas en el análisis
     */
    protected function generateRecommendations(
        array $mediaInfo,
        ?string $detectedType,
        $socialAccounts
    ): array {
        $recommendations = [];

        if ($mediaInfo['type'] !== 'video') {
            return $recommendations;
        }

        $aspectRatio = $mediaInfo['aspect_ratio'] ?? null;
        $duration = $mediaInfo['duration'] ?? 0;

        // Recomendaciones por tipo detectado
        if ($detectedType === 'reel' && $aspectRatio === '9:16') {
            $idealPlatforms = [];
            foreach ($socialAccounts as $account) {
                if (in_array($account->platform, ['instagram', 'tiktok', 'youtube'])) {
                    $idealPlatforms[] = $account->platform;
                }
            }
            
            if (!empty($idealPlatforms)) {
                $recommendations[] = "Este contenido es ideal para: " . implode(', ', array_map('ucfirst', $idealPlatforms));
            }
        }

        if ($aspectRatio === '16:9' && $duration > 90) {
            $recommendations[] = "Formato horizontal óptimo para YouTube y Facebook";
        }

        if ($duration > 60 && $duration <= 90) {
            $recommendations[] = "Considera recortar a 60s para mejor alcance en Instagram Feed";
        }

        return $recommendations;
    }

    /**
     * Obtiene el tipo recomendado para una plataforma
     */
    protected function getRecommendedType(string $platform, array $mediaInfo, ?string $detectedType): ?string
    {
        if ($mediaInfo['type'] !== 'video') {
            return null;
        }

        $aspectRatio = $mediaInfo['aspect_ratio'] ?? null;
        $duration = $mediaInfo['duration'] ?? 0;

        return match($platform) {
            'instagram' => $aspectRatio === '9:16' && $duration <= 90 ? 'reel' : 'feed',
            'youtube' => $duration <= 60 && $aspectRatio === '9:16' ? 'short' : 'standard',
            'facebook' => $aspectRatio === '9:16' && $duration <= 90 ? 'reel' : 'feed',
            'tiktok' => 'video',
            default => null,
        };
    }
}
