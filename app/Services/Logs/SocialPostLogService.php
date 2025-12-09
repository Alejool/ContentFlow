<?php

namespace App\Services\Logs;

use App\Models\Publications\Publication;
use App\Models\SocialAccount;
use App\Models\SocialPostLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class SocialPostLogService
{
    /**
     * Crea un log inicial en estado pending
     */
    public function createPendingLog(
        Publication $publication,
        SocialAccount $socialAccount,
        array $mediaUrls,
        string $content,
        ?int $mediaFileId = null
    ): SocialPostLog {
        return SocialPostLog::create([
            'user_id' => $publication->user_id,
            'social_account_id' => $socialAccount->id,
            'publication_id' => $publication->id,
            'media_file_id' => $mediaFileId,
            'platform' => $socialAccount->platform,
            'content' => $content,
            'media_urls' => $mediaUrls,
            'status' => 'pending',
            'retry_count' => 0,
        ]);
    }

    /**
     * Marca un log como publicado exitosamente
     */
    public function markAsPublished(
        SocialPostLog $postLog,
        array $response
    ): SocialPostLog {
        $postLog->update([
            'status' => 'published',
            'platform_post_id' => $response['post_id'] ?? null,
            'post_type' => $response['type'] ?? 'post',
            'published_at' => now(),
            'post_url' => $response['url'] ?? null,
            'engagement_data' => [
                'post_url' => $response['url'] ?? null,
                'post_type' => $response['type'] ?? 'post',
                'privacy' => $response['privacy'] ?? null,
                'title' => $response['title'] ?? null,
            ],
            'error_message' => null, 
        ]);

        Log::info('Post published successfully', [
            'post_log_id' => $postLog->id,
            'platform' => $postLog->platform,
            'platform_post_id' => $postLog->platform_post_id,
            'publication_id' => $postLog->publication_id,
        ]);

        return $postLog->fresh();
    }

    /**
     * Marca un log como fallido
     */
    public function markAsFailed(
        SocialPostLog $postLog,
        string $errorMessage
    ): SocialPostLog {
        $postLog->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);

        Log::error('Post publication failed', [
            'post_log_id' => $postLog->id,
            'platform' => $postLog->platform,
            'publication_id' => $postLog->publication_id,
            'error' => $errorMessage,
        ]);

        return $postLog->fresh();
    }

    /**
     * Incrementa el contador de reintentos
     */
    public function incrementRetry(SocialPostLog $postLog): SocialPostLog
    {
        $postLog->increment('retry_count');
        $postLog->update(['last_retry_at' => now()]);

        return $postLog->fresh();
    }

    /**
     * Resetea un log para reintento
     */
    public function resetForRetry(SocialPostLog $postLog): SocialPostLog
    {
        if (!$postLog->canRetry()) {
            throw new \Exception('Maximum retry attempts reached');
        }

        $this->incrementRetry($postLog);

        $postLog->update([
            'status' => 'pending',
        ]);

        Log::info('Post log reset for retry', [
            'post_log_id' => $postLog->id,
            'retry_count' => $postLog->retry_count,
        ]);

        return $postLog->fresh();
    }

    /**
     * Obtiene estadísticas de una publicación
     */
    public function getPublicationStats(int $publicationId): array
    {
        $logs = SocialPostLog::where('publication_id', $publicationId)->get();

        $byPlatform = [];
        foreach ($logs->groupBy('platform') as $platform => $platformLogs) {
            $byPlatform[$platform] = [
                'total' => $platformLogs->count(),
                'published' => $platformLogs->where('status', 'published')->count(),
                'failed' => $platformLogs->where('status', 'failed')->count(),
                'pending' => $platformLogs->where('status', 'pending')->count(),
            ];
        }

        return [
            'total' => $logs->count(),
            'published' => $logs->where('status', 'published')->count(),
            'failed' => $logs->where('status', 'failed')->count(),
            'pending' => $logs->where('status', 'pending')->count(),
            'by_platform' => $byPlatform,
        ];
    }

    /**
     * Obtiene los logs de una publicación con detalles
     */
    public function getPublicationLogs(int $publicationId): array
    {
        $logs = SocialPostLog::where('publication_id', $publicationId)
            ->with(['socialAccount', 'mediaFile'])
            ->orderBy('created_at', 'desc')
            ->get();

        return [
            'logs' => $logs,
            'summary' => $this->getPublicationStats($publicationId),
        ];
    }

    /**
     * Obtiene logs fallidos que pueden reintentarse
     */
    public function getRetryableLogs(int $publicationId): Collection
    {
        return SocialPostLog::where('publication_id', $publicationId)
            ->where('status', 'failed')
            ->where('retry_count', '<', 3)
            ->with(['socialAccount', 'mediaFile'])
            ->get();
    }

    /**
     * Obtiene logs de todas las publicaciones de una campaña
     */
    public function getCampaignLogs(int $campaignId, int $userId): array
    {
        // Obtener IDs de publicaciones de la campaña
        $publicationIds = Publication::whereHas('campaigns', function ($q) use ($campaignId) {
            $q->where('campaigns.id', $campaignId);
        })->pluck('id');

        $logs = SocialPostLog::whereIn('publication_id', $publicationIds)
            ->where('user_id', $userId)
            ->with(['socialAccount', 'mediaFile', 'publication'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Calcular resumen
        $summary = [
            'total' => $logs->count(),
            'published' => $logs->where('status', 'published')->count(),
            'failed' => $logs->where('status', 'failed')->count(),
            'pending' => $logs->where('status', 'pending')->count(),
        ];

        return [
            'logs' => $logs,
            'summary' => $summary,
        ];
    }
}
