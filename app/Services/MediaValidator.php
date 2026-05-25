<?php

namespace App\Services;

/**
 * Validador de Medios
 * 
 * Valida archivos de video e imágenes contra las especificaciones
 * técnicas de cada plataforma (formato, tamaño, duración, resolución, etc).
 */
class MediaValidator
{
    public function __construct(
        private PlatformConfigurationService $configService,
    ) {}

    /**
     * Valida todos los medios de una publicación para una plataforma
     */
    public function validateMedia(
        object $publication,
        string $platformKey,
        ?array $capabilities = null
    ): array {
        $errors = [];
        $warnings = [];

        $mediaFiles = $publication->mediaFiles ?? [];
        if (empty($mediaFiles)) {
            return ['errors' => $errors, 'warnings' => $warnings];
        }

        $mediaSpecs = $this->configService->getMediaSpecs($platformKey);
        if (!$mediaSpecs) {
            $errors[] = 'No media specifications available for this platform';
            return ['errors' => $errors, 'warnings' => $warnings];
        }

        // Contadores de medios
        $videoCount = 0;
        $imageCount = 0;

        foreach ($mediaFiles as $media) {
            if ($media->file_type === 'video') {
                $videoCount++;
                $videoErrors = $this->validateVideo($media, $mediaSpecs, $platformKey);
                $errors = array_merge($errors, $videoErrors['errors'] ?? []);
                $warnings = array_merge($warnings, $videoErrors['warnings'] ?? []);
            } elseif ($media->file_type === 'image') {
                $imageCount++;
                $imageErrors = $this->validateImage($media, $mediaSpecs);
                $errors = array_merge($errors, $imageErrors['errors'] ?? []);
                $warnings = array_merge($warnings, $imageErrors['warnings'] ?? []);
            }
        }

        // Validar conteos
        $countErrors = $this->validateMediaCounts($videoCount, $imageCount, $mediaSpecs, $platformKey);
        $errors = array_merge($errors, $countErrors);

        // Validar capacidades del plan
        if ($capabilities) {
            if (isset($capabilities['max_post_size_mb'])) {
                $totalSize = array_sum(array_map(fn($m) => $m->size, $mediaFiles)) / (1024 * 1024);
                if ($totalSize > $capabilities['max_post_size_mb']) {
                    $errors[] = sprintf(
                        'Total media size (%.2f MB) exceeds limit of %d MB',
                        $totalSize,
                        $capabilities['max_post_size_mb']
                    );
                }
            }
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Valida un archivo de video
     */
    private function validateVideo(object $media, array $mediaSpecs, string $platformKey): array
    {
        $errors = [];
        $warnings = [];

        $videoSpecs = $mediaSpecs['video'] ?? null;
        if (!$videoSpecs) {
            $errors[] = 'Platform does not support video uploads';
            return ['errors' => $errors, 'warnings' => $warnings];
        }

        // 1. Validar formato
        $extension = strtolower(pathinfo($media->file_name, PATHINFO_EXTENSION));
        $allowedFormats = $videoSpecs['formats'] ?? [];
        
        if (!in_array($extension, $allowedFormats)) {
            $errors[] = sprintf(
                'Video format "%s" not supported. Allowed: %s',
                $extension,
                implode(', ', $allowedFormats)
            );
        }

        // 2. Validar tamaño
        $sizeMB = $media->size / (1024 * 1024);
        $maxSizeMB = $videoSpecs['max_size_mb'] ?? PHP_INT_MAX;
        
        if ($sizeMB > $maxSizeMB) {
            $errors[] = sprintf(
                'Video size (%.2f MB) exceeds maximum of %d MB',
                $sizeMB,
                $maxSizeMB
            );
        } elseif ($sizeMB > ($maxSizeMB * 0.9)) {
            $warnings[] = sprintf(
                'Video size is close to limit: %.2f MB of %d MB allowed',
                $sizeMB,
                $maxSizeMB
            );
        }

        // 3. Validar duración
        $duration = $media->metadata['duration'] ?? null;
        if ($duration !== null) {
            $maxDuration = $videoSpecs['max_duration_seconds'] ?? PHP_INT_MAX;
            $minDuration = $videoSpecs['min_duration_seconds'] ?? 0;

            if ($duration > $maxDuration) {
                $errors[] = sprintf(
                    'Video duration (%s) exceeds maximum of %s',
                    $this->formatDuration($duration),
                    $this->formatDuration($maxDuration)
                );
            } elseif ($duration < $minDuration) {
                $errors[] = sprintf(
                    'Video duration (%s) is below minimum of %s',
                    $this->formatDuration($duration),
                    $this->formatDuration($minDuration)
                );
            } elseif ($duration > ($maxDuration * 0.8)) {
                $warnings[] = sprintf(
                    'Video duration is close to limit: %s of %s allowed',
                    $this->formatDuration($duration),
                    $this->formatDuration($maxDuration)
                );
            }
        }

        // 4. Validar resolución
        $width = $media->metadata['width'] ?? null;
        $height = $media->metadata['height'] ?? null;
        
        if ($width && $height && isset($videoSpecs['resolutions'])) {
            $minW = $videoSpecs['resolutions']['min_width'] ?? 0;
            $maxW = $videoSpecs['resolutions']['max_width'] ?? PHP_INT_MAX;
            $minH = $videoSpecs['resolutions']['min_height'] ?? 0;
            $maxH = $videoSpecs['resolutions']['max_height'] ?? PHP_INT_MAX;

            if ($width < $minW || $width > $maxW || $height < $minH || $height > $maxH) {
                $errors[] = sprintf(
                    'Video resolution (%dx%d) outside allowed range (%d-%d x %d-%d)',
                    $width, $height, $minW, $maxW, $minH, $maxH
                );
            }
        }

        // 5. Validar aspect ratio si se requiere
        if ($width && $height && isset($videoSpecs['aspect_ratio'])) {
            $required = $videoSpecs['aspect_ratio'];
            $actual = $this->calculateAspectRatio($width, $height);
            
            if ($actual !== $required) {
                $warnings[] = sprintf(
                    'Recommended aspect ratio: %s (current: %s)',
                    $required,
                    $actual
                );
            }
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Valida un archivo de imagen
     */
    private function validateImage(object $media, array $mediaSpecs): array
    {
        $errors = [];
        $warnings = [];

        $imageSpecs = $mediaSpecs['image'] ?? null;
        if (!$imageSpecs) {
            $errors[] = 'Platform does not support image uploads';
            return ['errors' => $errors, 'warnings' => $warnings];
        }

        // 1. Validar formato
        $extension = strtolower(pathinfo($media->file_name, PATHINFO_EXTENSION));
        $allowedFormats = $imageSpecs['formats'] ?? [];
        
        if (!in_array($extension, $allowedFormats)) {
            $errors[] = sprintf(
                'Image format "%s" not supported. Allowed: %s',
                $extension,
                implode(', ', $allowedFormats)
            );
        }

        // 2. Validar tamaño
        $sizeMB = $media->size / (1024 * 1024);
        $maxSizeMB = $imageSpecs['max_size_mb'] ?? PHP_INT_MAX;
        
        if ($sizeMB > $maxSizeMB) {
            $errors[] = sprintf(
                'Image size (%.2f MB) exceeds maximum of %d MB',
                $sizeMB,
                $maxSizeMB
            );
        }

        // 3. Validar resolución mínima si se especifica
        $width = $media->metadata['width'] ?? null;
        $height = $media->metadata['height'] ?? null;
        
        if ($width && isset($imageSpecs['min_width']) && $width < $imageSpecs['min_width']) {
            $errors[] = sprintf(
                'Image width (%d) below minimum (%d)',
                $width,
                $imageSpecs['min_width']
            );
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Valida los conteos de medios
     */
    private function validateMediaCounts(
        int $videoCount,
        int $imageCount,
        array $mediaSpecs,
        string $platformKey
    ): array {
        $errors = [];

        // Si hay videos, validar límite
        if ($videoCount > 0) {
            $maxVideos = $mediaSpecs['video']['max_per_post'] ?? $mediaSpecs['max_videos_per_post'] ?? 1;
            if ($videoCount > $maxVideos) {
                $errors[] = sprintf(
                    '%s only allows %d video%s per post (you provided %d)',
                    ucfirst($platformKey),
                    $maxVideos,
                    $maxVideos === 1 ? '' : 's',
                    $videoCount
                );
            }
        }

        // Si hay imágenes, validar límite
        if ($imageCount > 0) {
            $maxImages = $mediaSpecs['image']['max_per_post'] ?? $mediaSpecs['max_images_per_post'] ?? 1;
            if ($imageCount > $maxImages) {
                $errors[] = sprintf(
                    '%s only allows %d image%s per post (you provided %d)',
                    ucfirst($platformKey),
                    $maxImages,
                    $maxImages === 1 ? '' : 's',
                    $imageCount
                );
            }
        }

        return $errors;
    }

    /**
     * Calcula el aspect ratio (formato: "16:9")
     */
    private function calculateAspectRatio(int $width, int $height): string
    {
        $gcd = $this->gcd($width, $height);
        return ($width / $gcd) . ':' . ($height / $gcd);
    }

    /**
     * Calcula el máximo común divisor
     */
    private function gcd(int $a, int $b): int
    {
        return $b === 0 ? $a : $this->gcd($b, $a % $b);
    }

    /**
     * Formatea duración en segundos a formato legible
     */
    private function formatDuration(int $seconds): string
    {
        $hours = intdiv($seconds, 3600);
        $minutes = intdiv($seconds % 3600, 60);
        $secs = $seconds % 60;

        $parts = [];
        if ($hours > 0) {
            $parts[] = "{$hours}h";
        }
        if ($minutes > 0) {
            $parts[] = "{$minutes}m";
        }
        if ($secs > 0 || empty($parts)) {
            $parts[] = "{$secs}s";
        }

        return implode(' ', $parts);
    }
}
