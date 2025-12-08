<?php

namespace App\Services\Logs;

use App\Models\Campaigns\Campaign;
use App\Models\SocialAccounts\SocialAccount;
use App\Models\SocialPostLog;
use Illuminate\Support\Facades\Log;

class SocialPostLogService
{
    /**
     * Crea un log inicial en estado pending
     */
    public function createPendingLog(
        Campaign $campaign,
        SocialAccount $socialAccount,
        array $mediaUrls,
        string $content,
        ?int $mediaFileId = null
    ): SocialPostLog {
        return SocialPostLog::create([
            'user_id' => $campaign->user_id,
            'social_account_id' => $socialAccount->id,
            'campaign_id' => $campaign->id,
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
            'engagement_data' => [
                'post_url' => $response['url'] ?? null,
                'post_type' => $response['type'] ?? 'post',
                'privacy' => $response['privacy'] ?? null,
                'title' => $response['title'] ?? null,
            ],
            'error_message' => null, // Limpiar errores previos
        ]);

        Log::info('Post published successfully', [
            'post_log_id' => $postLog->id,
            'platform' => $postLog->platform,
            'platform_post_id' => $postLog->platform_post_id,
            'campaign_id' => $postLog->campaign_id,
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
            'campaign_id' => $postLog->campaign_id,
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
     * Obtiene estadísticas de una campaña
     */
    public function getCampaignStats(int $campaignId): array
    {
        $logs = SocialPostLog::where('campaign_id', $campaignId)->get();

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
     * Obtiene los logs de una campaña con detalles
     */
    public function getCampaignLogs(int $campaignId): array
    {
        $logs = SocialPostLog::where('campaign_id', $campaignId)
            ->with(['socialAccount', 'mediaFile'])
            ->orderBy('created_at', 'desc')
            ->get();

        return [
            'logs' => $logs,
            'summary' => $this->getCampaignStats($campaignId),
        ];
    }

    /**
     * Obtiene logs fallidos que pueden reintentarse
     */
    public function getRetryableLogs(int $campaignId): \Illuminate\Support\Collection
    {
        return SocialPostLog::where('campaign_id', $campaignId)
            ->where('status', 'failed')
            ->where('retry_count', '<', 3)
            ->with(['socialAccount', 'mediaFile'])
            ->get();
    }
}
