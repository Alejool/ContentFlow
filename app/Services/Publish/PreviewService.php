<?php

namespace App\Services\Publish;

use App\DTOs\PlatformConfigurationDTO;
use App\DTOs\PublicationPreviewDTO;
use App\Models\Publications\Publication;
use App\Models\Social\SocialAccount;
use App\Services\Validation\ContentValidationService;
use App\Services\Validation\MediaAnalyzer;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PreviewService
{
    public function __construct(
        protected ContentValidationService $validationService,
        protected MediaAnalyzer $mediaAnalyzer,
        protected AutoConfigurationService $autoConfigService
    ) {}

    /**
     * Genera la previsualización completa de una publicación
     */
    public function generatePreview(
        Publication $publication,
        array $platformIds,
        bool $autoOptimize = false
    ): PublicationPreviewDTO {
        
        // Validar contenido
        $validationResult = $this->validationService->validatePublication($publication, $platformIds);
        
        // Obtener cuentas sociales
        $socialAccounts = SocialAccount::whereIn('id', $platformIds)
            ->where('workspace_id', $publication->workspace_id)
            ->get();

        // Obtener información del media
        $mediaFile = $publication->mediaFiles->first();
        $mediaInfo = $mediaFile ? $this->mediaAnalyzer->analyze($mediaFile) : [];

        // Crear DTO de previsualización
        $preview = new PublicationPreviewDTO(
            publicationId: $publication->id,
            mediaInfo: $mediaInfo,
            detectedType: $validationResult->detectedType,
            mainThumbnail: $this->generateMainThumbnail($publication)
        );

        // Generar configuración para cada plataforma
        foreach ($socialAccounts as $account) {
            $platformResult = $validationResult->platformResults[$account->platform] ?? [];
            
            $config = PlatformConfigurationDTO::fromValidationResult(
                accountId: $account->id,
                platform: $account->platform,
                accountName: $account->account_name ?? ucfirst($account->platform),
                validationResult: $platformResult,
                mediaInfo: $mediaInfo,
                detectedType: $validationResult->detectedType
            );

            // Si auto-optimizar está activado, aplicar mejor configuración
            if ($autoOptimize) {
                $config = $this->autoConfigService->optimizeConfiguration($config, $mediaInfo);
            }

            // Generar miniatura específica de la plataforma
            $config->thumbnailUrl = $this->generatePlatformThumbnail($publication, $account->platform);

            $preview->addPlatformConfiguration($config);
        }

        // Agregar sugerencias de optimización
        $preview->optimizationSuggestions = $this->generateOptimizationSuggestions(
            $mediaInfo,
            $validationResult->detectedType,
            $socialAccounts
        );

        // Agregar advertencias globales
        $preview->globalWarnings = $validationResult->warnings;

        return $preview;
    }

    /**
     * Actualiza la configuración de una plataforma específica
     */
    public function updatePlatformConfiguration(
        Publication $publication,
        int $accountId,
        string $type,
        array $customSettings = []
    ): PlatformConfigurationDTO {
        
        $account = SocialAccount::findOrFail($accountId);
        $mediaFile = $publication->mediaFiles->first();
        $mediaInfo = $mediaFile ? $this->mediaAnalyzer->analyze($mediaFile) : [];

        // Validar que el tipo sea compatible
        $availableTypes = $this->getAvailableTypes($account->platform, $mediaInfo);
        
        if (!in_array($type, $availableTypes)) {
            throw new \InvalidArgumentException("Tipo '{$type}' no disponible para {$account->platform}");
        }

        // Validar con el nuevo tipo
        $validation = $this->validateWithType($mediaInfo, $account->platform, $type);

        $config = new PlatformConfigurationDTO(
            accountId: $account->id,
            platform: $account->platform,
            accountName: $account->account_name ?? ucfirst($account->platform),
            type: $type,
            isCompatible: $validation['is_compatible'],
            appliedSettings: $customSettings,
            thumbnailUrl: $this->generatePlatformThumbnail($publication, $account->platform),
            quality: PlatformConfigurationDTO::buildQualityInfo($mediaInfo),
            format: PlatformConfigurationDTO::buildFormatInfo($mediaInfo),
            canChangeType: count($availableTypes) > 1,
            availableTypes: $availableTypes,
            incompatibilityReason: $validation['error'] ?? null,
            warnings: $validation['warnings'] ?? []
        );

        // Guardar configuración en la publicación
        $this->savePlatformConfiguration($publication, $account->id, $config);

        return $config;
    }

    /**
     * Genera miniatura principal del video
     */
    protected function generateMainThumbnail(Publication $publication): ?string
    {
        $mediaFile = $publication->mediaFiles->first();
        
        if (!$mediaFile) {
            return null;
        }

        // Si ya tiene miniatura, usarla
        if ($mediaFile->thumbnail_path) {
            return Storage::url($mediaFile->thumbnail_path);
        }

        // Generar miniatura si es video
        if ($mediaFile->type === 'video') {
            return $this->extractVideoThumbnail($mediaFile);
        }

        // Si es imagen, usar la imagen misma
        return Storage::url($mediaFile->path);
    }

    /**
     * Genera miniatura específica para una plataforma
     */
    protected function generatePlatformThumbnail(Publication $publication, string $platform): ?string
    {
        // Por ahora, usar la miniatura principal
        // En el futuro, se pueden generar miniaturas optimizadas por plataforma
        return $this->generateMainThumbnail($publication);
    }

    /**
     * Extrae miniatura de un video usando FFmpeg
     */
    protected function extractVideoThumbnail($mediaFile): ?string
    {
        try {
            $videoPath = Storage::path($mediaFile->path);
            $thumbnailPath = 'thumbnails/' . pathinfo($mediaFile->filename, PATHINFO_FILENAME) . '.jpg';
            $fullThumbnailPath = Storage::path($thumbnailPath);

            // Crear directorio si no existe
            $dir = dirname($fullThumbnailPath);
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            // Extraer frame del segundo 1
            $command = sprintf(
                'ffmpeg -i %s -ss 00:00:01 -vframes 1 -q:v 2 %s 2>&1',
                escapeshellarg($videoPath),
                escapeshellarg($fullThumbnailPath)
            );

            exec($command, $output, $returnCode);

            if ($returnCode === 0 && file_exists($fullThumbnailPath)) {
                return Storage::url($thumbnailPath);
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Failed to extract video thumbnail', [
                'media_file_id' => $mediaFile->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Genera sugerencias de optimización
     */
    protected function generateOptimizationSuggestions(
        array $mediaInfo,
        ?string $detectedType,
        $socialAccounts
    ): array {
        $suggestions = [];

        if ($mediaInfo['type'] !== 'video') {
            return $suggestions;
        }

        $aspectRatio = $mediaInfo['aspect_ratio'] ?? null;
        $duration = $mediaInfo['duration'] ?? 0;

        // Sugerencias basadas en tipo detectado
        if ($detectedType === 'reel' && $aspectRatio === '9:16') {
            $idealPlatforms = [];
            foreach ($socialAccounts as $account) {
                if (in_array($account->platform, ['instagram', 'tiktok', 'youtube'])) {
                    $idealPlatforms[] = ucfirst($account->platform);
                }
            }
            
            if (!empty($idealPlatforms)) {
                $suggestions[] = "Este contenido es ideal para: " . implode(', ', $idealPlatforms);
            }
        }

        if ($aspectRatio === '16:9' && $duration > 90) {
            $suggestions[] = "Formato horizontal óptimo para YouTube y Facebook";
        }

        if ($aspectRatio === '9:16' && $duration <= 60) {
            $suggestions[] = "Perfecto para Reels, Shorts y TikTok";
        }

        return $suggestions;
    }

    /**
     * Valida contenido con un tipo específico
     */
    protected function validateWithType(array $mediaInfo, string $platform, string $type): array
    {
        $config = config("social_platforms.{$platform}");
        
        if (!$config) {
            return ['is_compatible' => false, 'error' => 'Plataforma no configurada'];
        }

        $mediaType = $mediaInfo['type'];
        $platformConfig = $config[$mediaType] ?? null;

        if (!$platformConfig) {
            return ['is_compatible' => false, 'error' => 'Tipo de contenido no soportado'];
        }

        // Obtener configuración específica del tipo
        $typeConfig = $platformConfig['types'][$type] ?? $platformConfig;

        $warnings = [];
        $errors = [];

        // Validar duración si es video
        if ($mediaType === 'video' && isset($typeConfig['max_duration_seconds'])) {
            $duration = $mediaInfo['duration'] ?? 0;
            if ($duration > $typeConfig['max_duration_seconds']) {
                $errors[] = "Duración excede el máximo para tipo '{$type}'";
            }
        }

        // Validar aspect ratio
        if (isset($typeConfig['aspect_ratio'])) {
            $aspectRatio = $mediaInfo['aspect_ratio'] ?? null;
            if ($aspectRatio !== $typeConfig['aspect_ratio']) {
                $warnings[] = "Relación de aspecto no óptima para tipo '{$type}'";
            }
        }

        return [
            'is_compatible' => empty($errors),
            'error' => !empty($errors) ? implode(', ', $errors) : null,
            'warnings' => $warnings
        ];
    }

    /**
     * Obtiene tipos disponibles para una plataforma
     */
    protected function getAvailableTypes(string $platform, array $mediaInfo): array
    {
        if ($mediaInfo['type'] !== 'video') {
            return ['feed'];
        }

        return match($platform) {
            'instagram' => ['feed', 'reel', 'story'],
            'facebook' => ['feed', 'reel', 'story'],
            'youtube' => ['standard', 'short'],
            'tiktok' => ['video'],
            'twitter' => ['tweet'],
            'linkedin' => ['post'],
            default => ['standard'],
        };
    }

    /**
     * Guarda la configuración de plataforma en la publicación
     */
    protected function savePlatformConfiguration(
        Publication $publication,
        int $accountId,
        PlatformConfigurationDTO $config
    ): void {
        $platformSettings = $publication->platform_settings ?? [];
        
        $platformSettings[$accountId] = [
            'type' => $config->type,
            'settings' => $config->appliedSettings,
            'updated_at' => now()->toIso8601String(),
        ];

        $publication->update(['platform_settings' => $platformSettings]);
    }
}
