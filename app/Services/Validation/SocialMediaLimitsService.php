<?php

namespace App\Services\Validation;

use App\Models\Social\SocialAccount;
use App\Models\Publications\Publication;
use Illuminate\Support\Facades\Log;

/**
 * Servicio para validar límites de contenido según el estado de verificación
 * de las cuentas en redes sociales.
 */
class SocialMediaLimitsService
{
    /**
     * Límites de video por plataforma según estado de verificación
     */
    private const PLATFORM_LIMITS = [
        'twitter' => [
            'verified' => [
                'max_video_duration' => 7200, // 2 horas en segundos
                'max_video_size_mb' => 512,
                'max_images_per_post' => 4,
            ],
            'unverified' => [
                'max_video_duration' => 140, // 2 minutos 20 segundos
                'max_video_size_mb' => 512,
                'max_images_per_post' => 4,
            ],
        ],
        'x' => [ // Alias para Twitter
            'verified' => [
                'max_video_duration' => 7200,
                'max_video_size_mb' => 512,
                'max_images_per_post' => 4,
            ],
            'unverified' => [
                'max_video_duration' => 140,
                'max_video_size_mb' => 512,
                'max_images_per_post' => 4,
            ],
        ],
        'facebook' => [
            'verified' => [
                'max_video_duration' => 14400, // 4 horas
                'max_video_size_mb' => 10240, // 10GB
                'max_images_per_post' => 10,
            ],
            'unverified' => [
                'max_video_duration' => 14400,
                'max_video_size_mb' => 10240,
                'max_images_per_post' => 10,
            ],
        ],
        'instagram' => [
            'verified' => [
                'max_video_duration' => 3600, // 60 minutos para IGTV
                'max_video_size_mb' => 650,
                'max_images_per_post' => 10,
            ],
            'unverified' => [
                'max_video_duration' => 90, // 90 segundos para Reels
                'max_video_size_mb' => 650,
                'max_images_per_post' => 10,
            ],
        ],
        'youtube' => [
            'verified' => [
                'max_video_duration' => 43200, // 12 horas
                'max_video_size_mb' => 256000, // 256GB
                'max_images_per_post' => 1, // Solo thumbnail
            ],
            'unverified' => [
                'max_video_duration' => 900, // 15 minutos
                'max_video_size_mb' => 256000,
                'max_images_per_post' => 1,
            ],
        ],
        'tiktok' => [
            'verified' => [
                'max_video_duration' => 600, // 10 minutos
                'max_video_size_mb' => 4096, // 4GB
                'max_images_per_post' => 0, // No soporta imágenes
            ],
            'unverified' => [
                'max_video_duration' => 180, // 3 minutos
                'max_video_size_mb' => 4096,
                'max_images_per_post' => 0,
            ],
        ],
    ];

    /**
     * Valida si una publicación puede ser publicada en las cuentas seleccionadas
     */
    public function validatePublication(Publication $publication, array $socialAccountIds): array
    {
        if (empty($socialAccountIds)) {
            return ['hasErrors' => false, 'results' => []];
        }

        $socialAccounts = SocialAccount::whereIn('id', $socialAccountIds)
            ->where('workspace_id', $publication->workspace_id)
            ->get();

        $validationResults = [];
        $hasErrors = false;

        foreach ($socialAccounts as $account) {
            $result = $this->validateForAccount($publication, $account);
            $validationResults[$account->id] = $result;
            
            if (!$result['can_publish']) {
                $hasErrors = true;
            }
        }

        return [
            'can_publish' => !$hasErrors,
            'results' => $validationResults,
        ];
    }

    /**
     * Valida una publicación contra una cuenta específica
     */
    public function validateForAccount(Publication $publication, SocialAccount $account): array
    {
        $platform = strtolower($account->platform);
        $isVerified = $this->isAccountVerified($account);
        
        $limits = $this->getLimitsForPlatform($platform, $isVerified);
        
        if (!$limits) {
            return [
                'can_publish' => false,
                'platform' => $platform,
                'account_name' => $account->account_name,
                'is_verified' => $isVerified,
                'errors' => ['Plataforma no soportada o configurada incorrectamente'],
                'warnings' => [],
            ];
        }

        $errors = [];
        $warnings = [];
        
        // Validar contenido multimedia
        $mediaFiles = $publication->mediaFiles;
        $contentType = $publication->content_type ?? 'post';
        
        if ($mediaFiles->isEmpty()) {
            // Solo validar media requerida para tipos de contenido que la necesitan
            // Las encuestas (polls) no requieren media
            if ($contentType !== 'poll' && in_array($platform, ['youtube', 'tiktok', 'instagram'])) {
                $errors[] = "La plataforma {$platform} requiere al menos un archivo multimedia";
            }
        } else {
            $videoCount = 0;
            $imageCount = 0;
            
            foreach ($mediaFiles as $mediaFile) {
                if ($mediaFile->file_type === 'video') {
                    $videoCount++;
                    $videoValidation = $this->validateVideo($mediaFile, $limits, $platform, $isVerified);
                    $errors = array_merge($errors, $videoValidation['errors']);
                    $warnings = array_merge($warnings, $videoValidation['warnings']);
                } elseif ($mediaFile->file_type === 'image') {
                    $imageCount++;
                }
            }
            
            // Validar cantidad de imágenes
            if ($imageCount > $limits['max_images_per_post']) {
                $errors[] = sprintf(
                    'Demasiadas imágenes (%d). Máximo permitido para %s: %d',
                    $imageCount,
                    $account->account_name,
                    $limits['max_images_per_post']
                );
            }
            
            // Validar combinación de video e imágenes
            if ($videoCount > 0 && $imageCount > 0) {
                if (in_array($platform, ['twitter', 'x'])) {
                    $errors[] = 'Twitter/X no permite combinar videos e imágenes en la misma publicación';
                } elseif ($platform === 'youtube') {
                    // YouTube solo permite 1 video + thumbnail
                    if ($videoCount > 1 || $imageCount > 1) {
                        $errors[] = 'YouTube solo permite 1 video con 1 imagen como thumbnail';
                    }
                }
            }
            
            // Validar múltiples videos
            if ($videoCount > 1) {
                if (!in_array($platform, ['facebook', 'instagram'])) {
                    $errors[] = sprintf(
                        '%s no permite múltiples videos en una sola publicación',
                        ucfirst($platform)
                    );
                }
            }
        }

        return [
            'can_publish' => empty($errors),
            'platform' => $platform,
            'account_name' => $account->account_name,
            'is_verified' => $isVerified,
            'errors' => $errors,
            'warnings' => $warnings,
            'limits' => $limits,
        ];
    }

    /**
     * Valida un archivo de video contra los límites de la plataforma
     */
    private function validateVideo(
        $mediaFile,
        array $limits,
        string $platform,
        bool $isVerified
    ): array {
        $errors = [];
        $warnings = [];
        
        // Obtener duración del video
        $duration = $mediaFile->metadata['duration'] ?? null;
        $sizeMB = $mediaFile->size / (1024 * 1024);
        
        // Validar duración
        if ($duration !== null) {
            $maxDuration = $limits['max_video_duration'];
            
            if ($duration > $maxDuration) {
                $maxMinutes = floor($maxDuration / 60);
                $maxSeconds = $maxDuration % 60;
                $currentMinutes = floor($duration / 60);
                $currentSeconds = $duration % 60;
                
                $verificationStatus = $isVerified ? 'verificada' : 'no verificada';
                
                $errors[] = sprintf(
                    'Video demasiado largo: %dm %ds. Máximo para cuenta %s en %s: %dm %ds. %s',
                    $currentMinutes,
                    $currentSeconds,
                    $verificationStatus,
                    ucfirst($platform),
                    $maxMinutes,
                    $maxSeconds,
                    $isVerified ? '' : 'Verifica tu cuenta para subir videos más largos.'
                );
            } elseif ($duration > ($maxDuration * 0.8)) {
                // Advertencia si está cerca del límite
                $warnings[] = sprintf(
                    'El video está cerca del límite de duración (%dm %ds de %dm %ds permitidos)',
                    floor($duration / 60),
                    $duration % 60,
                    floor($maxDuration / 60),
                    $maxDuration % 60
                );
            }
        }
        
        // Validar tamaño
        if ($sizeMB > $limits['max_video_size_mb']) {
            $errors[] = sprintf(
                'Video demasiado grande: %.2f MB. Máximo para %s: %d MB',
                $sizeMB,
                ucfirst($platform),
                $limits['max_video_size_mb']
            );
        } elseif ($sizeMB > ($limits['max_video_size_mb'] * 0.9)) {
            $warnings[] = sprintf(
                'El video está cerca del límite de tamaño (%.2f MB de %d MB permitidos)',
                $sizeMB,
                $limits['max_video_size_mb']
            );
        }
        
        return [
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    /**
     * Determina si una cuenta está verificada
     */
    private function isAccountVerified(SocialAccount $account): bool
    {
        $metadata = $account->account_metadata ?? [];
        
        // Verificar según la plataforma
        return match(strtolower($account->platform)) {
            'twitter', 'x' => $metadata['verified'] ?? $metadata['is_blue_verified'] ?? false,
            'instagram' => $metadata['is_verified'] ?? false,
            'facebook' => $metadata['is_verified'] ?? true, // Facebook pages generalmente no tienen restricción
            'youtube' => $metadata['is_verified'] ?? false,
            'tiktok' => $metadata['is_verified'] ?? false,
            default => false,
        };
    }

    /**
     * Obtiene los límites para una plataforma según su estado de verificación
     */
    private function getLimitsForPlatform(string $platform, bool $isVerified): ?array
    {
        $platform = strtolower($platform);
        
        if (!isset(self::PLATFORM_LIMITS[$platform])) {
            return null;
        }
        
        $status = $isVerified ? 'verified' : 'unverified';
        return self::PLATFORM_LIMITS[$platform][$status] ?? null;
    }

    /**
     * Obtiene un mensaje amigable explicando las limitaciones
     */
    public function getClientFriendlyMessage(array $validationResult): string
    {
        if ($validationResult['can_publish']) {
            return 'La publicación cumple con todos los requisitos de las plataformas seleccionadas.';
        }

        $messages = [];
        
        foreach ($validationResult['results'] as $accountId => $result) {
            if (!$result['can_publish']) {
                $platformName = ucfirst($result['platform']);
                $accountName = $result['account_name'];
                $isVerified = $result['is_verified'] ? 'verificada' : 'no verificada';
                
                $messages[] = sprintf(
                    "\n%s (%s - cuenta %s):",
                    $platformName,
                    $accountName,
                    $isVerified
                );
                
                foreach ($result['errors'] as $error) {
                    $messages[] = "  • " . $error;
                }
            }
        }
        
        return "No se puede publicar en las siguientes plataformas:\n" . implode("\n", $messages);
    }

    /**
     * Genera recomendaciones para optimizar el contenido
     */
    public function generateRecommendations(Publication $publication, array $socialAccountIds): array
    {
        $recommendations = [];
        
        $socialAccounts = empty($socialAccountIds)
            ? collect()
            : SocialAccount::whereIn('id', $socialAccountIds)->get();
        $mediaFiles = $publication->mediaFiles;
        
        if ($mediaFiles->isEmpty()) {
            return ['Agrega contenido multimedia para mejorar el engagement'];
        }
        
        foreach ($mediaFiles as $mediaFile) {
            if ($mediaFile->file_type === 'video') {
                $duration = $mediaFile->metadata['duration'] ?? 0;
                
                // Recomendaciones por duración
                if ($duration > 0 && $duration <= 60) {
                    $recommendations[] = 'Video corto ideal para Instagram Reels, TikTok y YouTube Shorts';
                } elseif ($duration > 60 && $duration <= 180) {
                    $recommendations[] = 'Duración óptima para Facebook y Twitter (cuentas verificadas)';
                } elseif ($duration > 180) {
                    $recommendations[] = 'Video largo: considera publicar solo en YouTube o dividir en partes más cortas';
                }
                
                // Recomendaciones por plataforma
                $hasUnverifiedTwitter = $socialAccounts->contains(function ($account) {
                    return in_array(strtolower($account->platform), ['twitter', 'x']) 
                        && !$this->isAccountVerified($account);
                });
                
                if ($hasUnverifiedTwitter && $duration > 140) {
                    $recommendations[] = 'Para publicar en Twitter/X sin verificación, el video debe ser menor a 2:20 minutos';
                }
            }
        }
        
        // Recomendación sobre verificación
        $unverifiedAccounts = $socialAccounts->filter(function ($account) {
            return !$this->isAccountVerified($account);
        });
        
        if ($unverifiedAccounts->isNotEmpty()) {
            $platforms = $unverifiedAccounts->pluck('platform')->unique()->implode(', ');
            $recommendations[] = sprintf(
                'Verifica tus cuentas de %s para desbloquear límites más altos de duración y tamaño',
                $platforms
            );
        }
        
        return array_unique($recommendations);
    }
}
