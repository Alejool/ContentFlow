<?php

namespace App\Services\Log;

use App\Models\Publications\Publication;
use App\Models\Social\SocialAccount;
use App\Models\Social\SocialPostLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class SocialPostLogService
{
  /**
   * Creates a new log entry in pending status.
   */
  public function createPendingLog(
    Publication $publication,
    SocialAccount $socialAccount,
    array $mediaUrls,
    string $content,
    ?int $mediaFileId = null,
    string $status = 'pending'
  ): SocialPostLog {
    // Search for an existing log for this publication, account, and media file
    $existingLog = SocialPostLog::where('publication_id', $publication->id)
      ->where('social_account_id', $socialAccount->id)
      ->where('media_file_id', $mediaFileId)
      ->first();

    if ($existingLog) {
      // If it exists, update it to the requested status (e.g. publishing) and update content
      // We explicitly set updated_at to now() to ensure the timestamp reflects this latest attempt
      $existingLog->status = $status;
      $existingLog->content = $content;
      $existingLog->media_urls = $mediaUrls;
      $existingLog->platform_settings = $publication->platform_settings;
      $existingLog->error_message = null;
      $existingLog->updated_at = now();
      $existingLog->save();

      return $existingLog;
    }

    Log::info('Creating new log', [
      'publication_id' => $publication->id,
      'social_account_id' => $socialAccount->id,
      'media_file_id' => $mediaFileId,
    ]);

    return SocialPostLog::create([
      'user_id' => $publication->user_id,
      'workspace_id' => $publication->workspace_id,
      'social_account_id' => $socialAccount->id,
      'publication_id' => $publication->id,
      'media_file_id' => $mediaFileId,
      'platform' => $socialAccount->platform,
      'account_name' => $socialAccount->account_name,
      'content' => $content,
      'media_urls' => $mediaUrls,
      'status' => $status,
      'retry_count' => 0,
      'platform_settings' => $publication->platform_settings,
    ]);
  }

  /**
   * Marks a log as successfully published
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
   * Marks a log as failed
   */
  public function markAsFailed(
    SocialPostLog $postLog,
    string $errorMessage
  ): SocialPostLog {
    $postLog->update([
      'status' => 'failed',
      'error_message' => substr($errorMessage, 0, 65000), // Truncate to avoid DB error
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
   * Increments the retry counter
   */
  public function incrementRetry(SocialPostLog $postLog): SocialPostLog
  {
    $postLog->increment('retry_count');
    $postLog->update(['last_retry_at' => now()]);

    return $postLog->fresh();
  }

  /**
   * Resets a log for retry
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
   * Gets statistics for a publication
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
   * Gets the logs of a publication with details
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
   * Gets failed logs that can be retried
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
   * Gets logs from all publications of a campaign
   */
  public function getCampaignLogs(int $campaignId, int $userId): array
  {
    // Get publication IDs from the campaign
    $publicationIds = Publication::whereHas('campaigns', function ($q) use ($campaignId) {
      $q->where('campaigns.id', $campaignId);
    })->pluck('id');

    $logs = SocialPostLog::whereIn('publication_id', $publicationIds)
      ->where('user_id', $userId)
      ->with(['socialAccount', 'mediaFile', 'publication'])
      ->orderBy('created_at', 'desc')
      ->get();

    // Calculate summary
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
