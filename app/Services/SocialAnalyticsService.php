<?php

namespace App\Services;

use App\Models\SocialAccount;
use App\Models\SocialPostLog;
use App\Services\SocialPlatforms\FacebookService;
use App\Services\SocialPlatforms\InstagramService;
use App\Services\SocialPlatforms\TwitterService;
use App\Services\SocialPlatforms\TikTokService;
use App\Services\SocialPlatforms\YouTubeService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SocialAnalyticsService
{
  protected $tokenManager;

  public function __construct(SocialTokenManager $tokenManager)
  {
    $this->tokenManager = $tokenManager;
  }

  /**
   * Fetch account metrics from platform
   */
  public function fetchAccountMetrics(SocialAccount $account): array
  {
    $cacheKey = "social_metrics_{$account->id}";

    return Cache::remember($cacheKey, 3600, function () use ($account) {
      try {
        $token = $this->tokenManager->getValidToken($account);
        $service = $this->getPlatformService($account->platform, $token);

        $info = $service->getAccountInfo();

        // Update account metadata
        $account->update([
          'account_name' => $info['name'] ?? $info['username'] ?? $info['title'] ?? null,
          'account_metadata' => $info,
        ]);

        return $this->normalizeAccountMetrics($account->platform, $info);
      } catch (\Exception $e) {
        Log::error("Failed to fetch metrics for {$account->platform}: " . $e->getMessage());
        return [];
      }
    });
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
   * Generate analytics report for a date range
   */
  public function generateAnalyticsReport(int $userId, $startDate, $endDate): array
  {
    $posts = SocialPostLog::where('user_id', $userId)
      ->whereBetween('published_at', [$startDate, $endDate])
      ->where('status', 'published')
      ->get();

    $report = [
      'period' => [
        'start' => $startDate,
        'end' => $endDate,
      ],
      'summary' => [
        'total_posts' => $posts->count(),
        'by_platform' => [],
        'total_engagement' => 0,
      ],
      'top_posts' => [],
    ];

    // Group by platform
    foreach ($posts->groupBy('platform') as $platform => $platformPosts) {
      $report['summary']['by_platform'][$platform] = $platformPosts->count();
    }

    // Calculate total engagement
    foreach ($posts as $post) {
      $engagement = $post->getEngagementMetrics();
      $totalEngagement = array_sum($engagement);
      $report['summary']['total_engagement'] += $totalEngagement;

      // Track top posts
      $report['top_posts'][] = [
        'id' => $post->id,
        'platform' => $post->platform,
        'content' => substr($post->content, 0, 100),
        'engagement' => $totalEngagement,
        'published_at' => $post->published_at,
      ];
    }

    // Sort top posts by engagement
    usort($report['top_posts'], fn($a, $b) => $b['engagement'] <=> $a['engagement']);
    $report['top_posts'] = array_slice($report['top_posts'], 0, 10);

    return $report;
  }

  /**
   * Update engagement data for a post
   */
  public function updatePostEngagement(SocialPostLog $post): void
  {
    if (!$post->platform_post_id) {
      return;
    }

    $account = $post->socialAccount;
    $metrics = $this->fetchPostMetrics($post->platform_post_id, $post->platform, $account);

    $post->update([
      'engagement_data' => $metrics,
    ]);
  }

  /**
   * Get platform service instance
   */
  protected function getPlatformService(string $platform, string $token)
  {
    return match ($platform) {
      'facebook' => new FacebookService($token),
      'instagram' => new InstagramService($token),
      'twitter' => new TwitterService($token),
      'tiktok' => new TikTokService($token),
      'youtube' => new YouTubeService($token),
      default => throw new \Exception("Unsupported platform: {$platform}"),
    };
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
        'name' => $data['name'] ?? '',
      ],
      'instagram' => [
        'followers' => $data['followers_count'] ?? 0,
        'posts' => $data['media_count'] ?? 0,
        'engagement' => 0,
        'name' => $data['username'] ?? '',
      ],
      'twitter' => [
        'followers' => $data['public_metrics']['followers_count'] ?? 0,
        'posts' => $data['public_metrics']['tweet_count'] ?? 0,
        'engagement' => 0,
        'name' => $data['username'] ?? '',
      ],
      'tiktok' => [
        'followers' => $data['follower_count'] ?? 0,
        'posts' => $data['video_count'] ?? 0,
        'engagement' => $data['likes_count'] ?? 0,
        'name' => $data['display_name'] ?? '',
      ],
      'youtube' => [
        'followers' => $data['subscribers'] ?? 0,
        'posts' => $data['video_count'] ?? 0,
        'engagement' => $data['view_count'] ?? 0,
        'name' => $data['title'] ?? '',
      ],
      default => [],
    };
  }
}
