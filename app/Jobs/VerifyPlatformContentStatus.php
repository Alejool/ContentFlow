<?php

namespace App\Jobs;

use App\Models\Social\SocialPostLog;
use App\Models\Publications\Publication;
use App\Services\SocialPlatformFactory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Notifications\VideoDeletedNotification;
use App\Notifications\PublicationStatusUpdate;

/**
 * Job genérico para verificar el estado de contenido publicado en cualquier plataforma
 * Verifica si el contenido sigue existiendo en la plataforma y actualiza el estado
 */
class VerifyPlatformContentStatus implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $postLog;
    public $tries = 2;
    public $backoff = [300, 600]; // 5m, 10m

    public function __construct(SocialPostLog $postLog)
    {
        $this->postLog = $postLog;
        $this->onQueue('low'); // Baja prioridad para validaciones periódicas
    }

    public function handle()
    {
        $platformPostId = $this->postLog->platform_post_id;
        if (!$platformPostId) {
            Log::warning('VerifyPlatformContentStatus: No platform_post_id found', [
                'log_id' => $this->postLog->id,
                'platform' => $this->postLog->platform
            ]);
            return;
        }

        $socialAccount = $this->postLog->socialAccount;
        if (!$socialAccount) {
            Log::warning('VerifyPlatformContentStatus: No social account found', [
                'log_id' => $this->postLog->id,
                'platform' => $this->postLog->platform
            ]);
            return;
        }

        try {
            $platformService = SocialPlatformFactory::make(
                $this->postLog->platform,
                $socialAccount->access_token,
                $socialAccount
            );

            // Verificar si el servicio tiene el método de verificación
            if (!method_exists($platformService, 'checkContentStatus')) {
                Log::info('Platform does not support content verification', [
                    'platform' => $this->postLog->platform
                ]);
                return;
            }

            $statusData = $platformService->checkContentStatus($platformPostId);

            Log::info('Platform Content Status Check', [
                'log_id' => $this->postLog->id,
                'platform' => $this->postLog->platform,
                'status' => $statusData
            ]);

            if (!$statusData['exists']) {
                $this->markAsDeleted($statusData['reason'] ?? 'Content no longer exists on platform');
                return;
            }

            // Actualizar métricas si están disponibles
            if (isset($statusData['metrics'])) {
                $this->updateMetrics($statusData['metrics']);
            }

        } catch (\Exception $e) {
            Log::error('VerifyPlatformContentStatus error', [
                'log_id' => $this->postLog->id,
                'platform' => $this->postLog->platform,
                'error' => $e->getMessage()
            ]);
            
            // No lanzar excepción para evitar reintentos innecesarios
            // Solo registrar el error
        }
    }

    protected function markAsDeleted(string $reason): void
    {
        $this->postLog->update([
            'status' => 'removed_on_platform',
            'error_message' => $reason,
            'notes' => ($this->postLog->notes ?? '') . "\n[" . now()->toDateTimeString() . "] Content removed from platform: {$reason}"
        ]);

        Log::warning('Content marked as removed from platform', [
            'log_id' => $this->postLog->id,
            'platform' => $this->postLog->platform,
            'platform_post_id' => $this->postLog->platform_post_id,
            'reason' => $reason
        ]);

        // Notificar al usuario
        $publication = $this->postLog->publication;
        if ($publication && $publication->user) {
            try {
                $publication->user->notify(new VideoDeletedNotification($this->postLog));
            } catch (\Exception $e) {
                Log::error('Failed to send deletion notification', [
                    'error' => $e->getMessage(),
                    'log_id' => $this->postLog->id
                ]);
            }
        }
    }

    protected function updateMetrics(array $metrics): void
    {
        $currentMetrics = $this->postLog->engagement_data ?? [];
        
        $this->postLog->update([
            'engagement_data' => array_merge($currentMetrics, $metrics)
        ]);

        Log::info('Updated content metrics', [
            'log_id' => $this->postLog->id,
            'platform' => $this->postLog->platform,
            'metrics' => $metrics
        ]);
    }
}
