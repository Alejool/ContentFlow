<?php

namespace App\Services\Validation;

use App\Models\Social\SocialAccount;
use App\Models\Publications\Publication;
use App\Services\PlatformConfigurationService;
use App\Services\ContentValidator;
use Illuminate\Support\Facades\Log;

/**
 * Servicio para validar límites de contenido según el estado de verificación
 * de las cuentas en redes sociales.
 * 
 * REFACTORIZADO (Fase 4): 
 * - Ahora consume la configuración centralizada desde PlatformConfigurationService
 * - Delega validación al ContentValidator
 * - Actúa como adaptador de compatibilidad con código legacy
 */
class SocialMediaLimitsService
{
    public function __construct(
        private PlatformConfigurationService $configService,
        private ContentValidator $contentValidator,
    ) {}

    /**
     * Valida si una publicación puede ser publicada en las cuentas seleccionadas
     */
    public function validatePublication(Publication $publication, array $socialAccountIds): array
    {
        if (empty($socialAccountIds)) {
            return ['can_publish' => false, 'results' => []];
        }

        $socialAccounts = SocialAccount::whereIn('id', $socialAccountIds)
            ->where('workspace_id', $publication->workspace_id)
            ->get();

        if ($socialAccounts->isEmpty()) {
            return ['can_publish' => false, 'results' => []];
        }

        $platformKeys = $socialAccounts->pluck('platform')->unique()->toArray();
        
        // Obtener plan del usuario (from workspace subscription)
        $userPlan = $publication->workspace?->subscription_plan ?? 'free';
        
        // Usar el nuevo validador centralizado
        $validationResult = $this->contentValidator->validate(
            $publication,
            $platformKeys,
            $userPlan
        );

        $validationResults = [];
        $hasErrors = false;

        foreach ($socialAccounts as $account) {
            $platform = strtolower($account->platform);
            $result = $validationResult[$platform] ?? ['compatible' => false, 'errors' => []];
            
            $validationResults[$account->id] = [
                'can_publish' => $result['compatible'] ?? false,
                'platform' => $platform,
                'account_name' => $account->account_name,
                'is_verified' => $this->isAccountVerified($account),
                'errors' => $result['errors'] ?? [],
                'warnings' => $result['warnings'] ?? [],
                'reason' => $result['reason'] ?? null,
            ];

            if (!$result['compatible']) {
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
     * 
     * LEGACY: Mantiene compatibilidad con código antiguo. 
     * Preferir usar validatePublication() para nuevas integraciones.
     */
    public function validateForAccount(Publication $publication, SocialAccount $account): array
    {
        $platform = strtolower($account->platform);
        $userPlan = $publication->workspace?->subscription_plan ?? 'free';
        
        $result = $this->contentValidator->validateForPlatform(
            $publication,
            $platform,
            $userPlan
        );

        return [
            'can_publish' => $result['compatible'] ?? false,
            'platform' => $platform,
            'account_name' => $account->account_name,
            'is_verified' => $this->isAccountVerified($account),
            'errors' => $result['errors'] ?? [],
            'warnings' => $result['warnings'] ?? [],
            'reason' => $result['reason'] ?? null,
        ];
    }    /**
     * Determina si una cuenta está verificada
     */
    private function isAccountVerified(SocialAccount $account): bool
    {
        $metadata = $account->account_metadata ?? [];
        
        // Verificar según la plataforma
        return match(strtolower($account->platform)) {
            'twitter', 'x' => $metadata['verified'] ?? $metadata['is_blue_verified'] ?? false,
            'instagram' => $metadata['is_verified'] ?? false,
            'facebook' => $metadata['is_verified'] ?? true,
            'youtube' => $metadata['is_verified'] ?? false,
            'tiktok' => $metadata['is_verified'] ?? false,
            default => false,
        };
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
        $mediaFiles = $publication->mediaFiles ?? collect();
        
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

    /**
     * Obtiene estadísticas sobre la configuración de plataformas
     */
    public function getConfigurationStats(): array
    {
        return $this->configService->getConfigurationStats();
    }
}
