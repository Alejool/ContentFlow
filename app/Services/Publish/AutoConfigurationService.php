<?php

namespace App\Services\Publish;

use App\DTOs\PlatformConfigurationDTO;
use Illuminate\Support\Facades\Log;

class AutoConfigurationService
{
    /**
     * Optimiza automáticamente la configuración para una plataforma
     */
    public function optimizeConfiguration(
        PlatformConfigurationDTO $config,
        array $mediaInfo
    ): PlatformConfigurationDTO {
        
        if ($mediaInfo['type'] !== 'video') {
            return $config;
        }

        $aspectRatio = $mediaInfo['aspect_ratio'] ?? null;
        $duration = $mediaInfo['duration'] ?? 0;
        $width = $mediaInfo['width'] ?? 0;
        $height = $mediaInfo['height'] ?? 0;

        // Determinar el mejor tipo según la plataforma y características del video
        $optimalType = $this->determineOptimalType(
            $config->platform,
            $aspectRatio,
            $duration,
            $width,
            $height
        );

        // Si el tipo óptimo está disponible, usarlo
        if (in_array($optimalType, $config->availableTypes)) {
            $config->type = $optimalType;
        }

        // Aplicar configuraciones específicas
        $config->appliedSettings = $this->generateOptimalSettings(
            $config->platform,
            $config->type,
            $mediaInfo
        );

        return $config;
    }

    /**
     * Determina el tipo óptimo de publicación
     */
    protected function determineOptimalType(
        string $platform,
        ?string $aspectRatio,
        int $duration,
        int $width,
        int $height
    ): string {
        
        return match($platform) {
            'instagram' => $this->determineInstagramType($aspectRatio, $duration),
            'facebook' => $this->determineFacebookType($aspectRatio, $duration),
            'youtube' => $this->determineYouTubeType($aspectRatio, $duration),
            'tiktok' => 'video',
            'twitter' => 'tweet',
            'linkedin' => 'post',
            default => 'standard',
        };
    }

    /**
     * Determina el mejor tipo para Instagram
     */
    protected function determineInstagramType(?string $aspectRatio, int $duration): string
    {
        // Vertical y corto = Reel
        if ($aspectRatio === '9:16' && $duration <= 90) {
            return 'reel';
        }

        // Muy corto = Story
        if ($duration <= 15) {
            return 'story';
        }

        // Por defecto = Feed
        return 'feed';
    }

    /**
     * Determina el mejor tipo para Facebook
     */
    protected function determineFacebookType(?string $aspectRatio, int $duration): string
    {
        // Vertical y corto = Reel
        if ($aspectRatio === '9:16' && $duration <= 90) {
            return 'reel';
        }

        // Muy corto = Story
        if ($duration <= 15) {
            return 'story';
        }

        // Por defecto = Feed
        return 'feed';
    }

    /**
     * Determina el mejor tipo para YouTube
     */
    protected function determineYouTubeType(?string $aspectRatio, int $duration): string
    {
        // Vertical y menor a 60s = Short
        if ($aspectRatio === '9:16' && $duration <= 60) {
            return 'short';
        }

        // Por defecto = Standard
        return 'standard';
    }

    /**
     * Genera configuraciones óptimas para la plataforma
     */
    protected function generateOptimalSettings(
        string $platform,
        string $type,
        array $mediaInfo
    ): array {
        
        $settings = [
            'auto_optimized' => true,
            'optimization_timestamp' => now()->toIso8601String(),
        ];

        // Configuraciones específicas por plataforma
        $settings = array_merge($settings, match($platform) {
            'instagram' => $this->getInstagramSettings($type, $mediaInfo),
            'facebook' => $this->getFacebookSettings($type, $mediaInfo),
            'youtube' => $this->getYouTubeSettings($type, $mediaInfo),
            'tiktok' => $this->getTikTokSettings($mediaInfo),
            default => [],
        });

        return $settings;
    }

    /**
     * Configuraciones para Instagram
     */
    protected function getInstagramSettings(string $type, array $mediaInfo): array
    {
        $settings = [
            'type' => $type,
        ];

        if ($type === 'reel') {
            $settings['cover_frame_time'] = 1; // Segundo 1 como portada
            $settings['share_to_feed'] = true;
            $settings['enable_comments'] = true;
        }

        if ($type === 'story') {
            $settings['duration'] = min($mediaInfo['duration'] ?? 15, 15);
        }

        return $settings;
    }

    /**
     * Configuraciones para Facebook
     */
    protected function getFacebookSettings(string $type, array $mediaInfo): array
    {
        $settings = [
            'type' => $type,
        ];

        if ($type === 'reel') {
            $settings['enable_comments'] = true;
            $settings['allow_embedding'] = true;
        }

        return $settings;
    }

    /**
     * Configuraciones para YouTube
     */
    protected function getYouTubeSettings(string $type, array $mediaInfo): array
    {
        $settings = [
            'type' => $type,
            'privacy' => 'public',
        ];

        if ($type === 'short') {
            $settings['category'] = 'Entertainment';
            $settings['made_for_kids'] = false;
        } else {
            $settings['category'] = 'Entertainment';
            $settings['made_for_kids'] = false;
            $settings['enable_comments'] = true;
            $settings['enable_ratings'] = true;
        }

        return $settings;
    }

    /**
     * Configuraciones para TikTok
     */
    protected function getTikTokSettings(array $mediaInfo): array
    {
        return [
            'type' => 'video',
            'allow_comments' => true,
            'allow_duet' => true,
            'allow_stitch' => true,
            'privacy_level' => 'public',
        ];
    }

    /**
     * Optimiza todas las plataformas de una vez
     */
    public function optimizeAllPlatforms(
        array $platformConfigs,
        array $mediaInfo
    ): array {
        
        $optimized = [];

        foreach ($platformConfigs as $config) {
            if ($config instanceof PlatformConfigurationDTO) {
                $optimized[] = $this->optimizeConfiguration($config, $mediaInfo);
            }
        }

        return $optimized;
    }

    /**
     * Genera recomendaciones de optimización
     */
    public function generateRecommendations(
        PlatformConfigurationDTO $config,
        array $mediaInfo
    ): array {
        
        $recommendations = [];

        if ($mediaInfo['type'] !== 'video') {
            return $recommendations;
        }

        $aspectRatio = $mediaInfo['aspect_ratio'] ?? null;
        $duration = $mediaInfo['duration'] ?? 0;

        // Recomendaciones por plataforma
        switch ($config->platform) {
            case 'instagram':
                if ($config->type === 'feed' && $aspectRatio === '9:16' && $duration <= 90) {
                    $recommendations[] = "Este video es ideal para Reel en lugar de Feed";
                }
                if ($config->type === 'reel' && $duration > 60) {
                    $recommendations[] = "Considera recortar a 60s para mejor alcance";
                }
                break;

            case 'youtube':
                if ($config->type === 'standard' && $aspectRatio === '9:16' && $duration <= 60) {
                    $recommendations[] = "Este video es perfecto para YouTube Short";
                }
                if ($config->type === 'short' && $aspectRatio !== '9:16') {
                    $recommendations[] = "Los Shorts funcionan mejor en formato vertical (9:16)";
                }
                break;

            case 'facebook':
                if ($aspectRatio === '9:16' && $duration <= 90) {
                    $recommendations[] = "Considera publicar como Reel para mayor alcance";
                }
                break;
        }

        return $recommendations;
    }
}
