<?php

namespace App\Services;

use App\Models\SocialAccount;
use App\Models\SocialPostLog;
use App\Models\SocialMediaMetrics;
use App\Models\CampaignAnalytics;
use App\Services\SocialPlatforms\SocialPlatformFactory;

use Illuminate\Support\Facades\Log;

class SocialAnalyticsService
{
  protected $tokenManager;

  public function __construct(SocialTokenManager $tokenManager)
  {
    $this->tokenManager = $tokenManager;
  }

  /**
   * Fetch and persist account metrics from platform
   */
  public function fetchAccountMetrics(SocialAccount $account): array
  {
    try {
      $token = $this->tokenManager->getValidToken($account);
      $service = $this->getPlatformService($account->platform, $token);

      $info = $service->getAccountInfo();
      $normalized = $this->normalizeAccountMetrics($account->platform, $info);

      $account->update([
        'account_name' => $normalized['name'] ?? $account->account_name,
        'account_metadata' => $info,
      ]);

      $previousMetrics = SocialMediaMetrics::where('social_account_id', $account->id)
        ->where('date', '<', now()->toDateString())
        ->orderBy('date', 'desc')
        ->first();

      $followersGained = 0;
      $followersLost = 0;

      if ($previousMetrics) {
        $diff = ($normalized['followers'] ?? 0) - $previousMetrics->followers;
        if ($diff > 0) {
          $followersGained = $diff;
        } elseif ($diff < 0) {
          $followersLost = abs($diff);
        }
      }

      SocialMediaMetrics::updateOrCreate(
        [
          'social_account_id' => $account->id,
          'date' => now()->toDateString(),
        ],
        [
          'user_id' => $account->user_id,
          'followers' => $normalized['followers'] ?? 0,
          'following' => $normalized['following'] ?? 0,
          'posts_count' => $normalized['posts'] ?? 0,
          'total_likes' => $normalized['engagement'] ?? 0,
          'reach' => $normalized['reach'] ?? 0,
          'followers_gained' => $followersGained,
          'followers_lost' => $followersLost,
          'engagement_rate' => $normalized['engagement_rate'] ?? 0,
          'metadata' => $info,
        ]
      );

      return $normalized;
    } catch (\Exception $e) {
      Log::error("Failed to fetch metrics for {$account->platform} (Account: {$account->id}): " . $e->getMessage());
      return [];
    }
  }

  /**
   * Sync metrics for recent posts of an account
   */
  public function syncRecentPostsMetrics(SocialAccount $account, int $days = 7): void
  {
    try {
      $token = $this->tokenManager->getValidToken($account);
      $service = $this->getPlatformService($account->platform, $token);

      $posts = $account->postLogs()
        ->where('status', 'published')
        ->where('published_at', '>=', now()->subDays($days))
        ->get();

      foreach ($posts as $post) {
        if (!$post->platform_post_id) continue;

        try {
          $metrics = $service->getPostAnalytics($post->platform_post_id);

          $post->update([
            'engagement_data' => array_merge($post->engagement_data ?? [], $metrics, ['synced_at' => now()->toIso8601String()])
          ]);

          if ($post->publication_id) {
            CampaignAnalytics::updateOrCreate(
              [
                'publication_id' => $post->publication_id,
                'platform' => $account->platform,
                'date' => now()->toDateString(),
              ],
              [
                'user_id' => $account->user_id,
                'views' => $metrics['views'] ?? $metrics['impressions'] ?? 0,
                'reach' => $metrics['reach'] ?? 0,
                'impressions' => $metrics['impressions'] ?? 0,
                'likes' => $metrics['likes'] ?? 0,
                'comments' => $metrics['comments'] ?? 0,
                'shares' => $metrics['shares'] ?? $metrics['retweets'] ?? 0,
                'saves' => $metrics['saved'] ?? 0,
                'metadata' => $metrics,
              ]
            );
          }
        } catch (\Exception $postException) {
          Log::warning("Failed to sync metrics for post {$post->id}: " . $postException->getMessage());
        }
      }
    } catch (\Exception $e) {
      Log::error("Failed to start post sync for account {$account->id}: " . $e->getMessage());
    }
  }

  /**
   * Fetch post-specific metrics
   */
  public function fetchPostMetrics(string $platformPostId, string $platform, SocialAccount $account): array
  {
    try {
      $token = $this->tokenManager->getValidToken($account);
      $service = $this->getPlatformService($platform, $token);

      return $service->getPostAnalytics($platformPostId);
    } catch (\Exception $e) {
      Log::error("Failed to fetch post metrics: " . $e->getMessage());
      return [];
    }
  }

  /**
   * Aggregate metrics across all platforms for a user
   */
  public function aggregateCrossplatformMetrics(int $userId): array
  {
    $accounts = SocialAccount::where('user_id', $userId)
      ->where('is_active', true)
      ->get();

    $aggregated = [
      'total_followers' => 0,
      'total_posts' => 0,
      'total_engagement' => 0,
      'platforms' => [],
    ];

    foreach ($accounts as $account) {
      $metrics = $this->fetchAccountMetrics($account);

      $aggregated['total_followers'] += $metrics['followers'] ?? 0;
      $aggregated['total_posts'] += $metrics['posts'] ?? 0;
      $aggregated['total_engagement'] += $metrics['engagement'] ?? 0;

      $aggregated['platforms'][$account->platform] = $metrics;
    }

    return $aggregated;
  }

  /**
   * Update engagement data for a post (Individual sync)
   */
  public function updatePostEngagement(SocialPostLog $post): void
  {
    if (!$post->platform_post_id || !$post->socialAccount) {
      return;
    }

    $metrics = $this->fetchPostMetrics($post->platform_post_id, $post->platform, $post->socialAccount);

    if (!empty($metrics)) {
      $post->update([
        'engagement_data' => array_merge($post->engagement_data ?? [], $metrics, ['synced_at' => now()->toIso8601String()]),
      ]);
    }
  }

  /**
   * Get platform service instance
   */
  protected function getPlatformService(string $platform, string $token)
  {
    return SocialPlatformFactory::make($platform, $token);
  }

  /**
   * Normalize account metrics across platforms
   */
  protected function normalizeAccountMetrics(string $platform, array $data): array
  {
    return match ($platform) {
      'facebook' => [
        'followers' => $data['followers_count'] ?? 0,
        'posts' => 0,
        'engagement' => 0,
        'reach' => $data['reach'] ?? 0,
        'name' => $data['name'] ?? '',
      ],
      'instagram' => [
        'followers' => $data['followers_count'] ?? 0,
        'posts' => $data['media_count'] ?? 0,
        'engagement' => 0,
        'reach' => $data['reach'] ?? 0,
        'name' => $data['username'] ?? '',
      ],
      'twitter' => [
        'followers' => $data['public_metrics']['followers_count'] ?? 0,
        'posts' => $data['public_metrics']['tweet_count'] ?? 0,
        'engagement' => 0,
        'reach' => $data['reach'] ?? 0,
        'name' => $data['username'] ?? '',
      ],
      'tiktok' => [
        'followers' => $data['follower_count'] ?? 0,
        'posts' => $data['video_count'] ?? 0,
        'engagement' => $data['likes_count'] ?? 0,
        'reach' => $data['reach'] ?? 0,
        'name' => $data['display_name'] ?? '',
      ],
      'youtube' => [
        'followers' => $data['subscribers'] ?? 0,
        'posts' => $data['video_count'] ?? 0,
        'engagement' => $data['view_count'] ?? 0,
        'reach' => $data['view_count'] ?? 0,
        'name' => $data['title'] ?? '',
      ],
      default => [],
    };
  }
}
