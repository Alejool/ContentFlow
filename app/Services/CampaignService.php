<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\ScheduledPost;
use App\Models\SocialPostLog;
use Illuminate\Support\Facades\DB;

class CampaignService
{
  protected $postService;
  protected $analyticsService;

  public function __construct(SocialPostService $postService, SocialAnalyticsService $analyticsService)
  {
    $this->postService = $postService;
    $this->analyticsService = $analyticsService;
  }

  /**
   * Create a new campaign with scheduled posts
   */
  public function createCampaign(array $data): Campaign
  {
    return DB::transaction(function () use ($data) {
      $campaign = Campaign::create([
        'user_id' => $data['user_id'],
        'title' => $data['title'],
        'description' => $data['description'] ?? null,
        'goal' => $data['goal'] ?? null,
        'hashtags' => $data['hashtags'] ?? null,
        'status' => 'draft',
      ]);

      return $campaign;
    });
  }

  /**
   * Schedule posts for a campaign
   */
  public function scheduleCampaignPosts(int $campaignId, array $posts): array
  {
    $campaign = Campaign::findOrFail($campaignId);
    $scheduledPosts = [];

    foreach ($posts as $postData) {
      $scheduledPost = ScheduledPost::create([
        'user_id' => $campaign->user_id,
        'campaign_id' => $campaign->id,
        'social_account_id' => $postData['social_account_id'],
        'media_file_id' => $postData['media_file_id'] ?? null,
        'caption' => $postData['caption'],
        'scheduled_at' => $postData['scheduled_at'],
        'status' => 'pending',
      ]);

      $scheduledPosts[] = $scheduledPost;
    }

    // Update campaign status
    $campaign->update(['status' => 'scheduled']);

    return $scheduledPosts;
  }

  /**
   * Get campaign performance metrics
   */
  public function getCampaignPerformance(int $campaignId): array
  {
    $campaign = Campaign::with(['scheduledPosts.postLogs'])->findOrFail($campaignId);

    $metrics = [
      'campaign_id' => $campaign->id,
      'title' => $campaign->title,
      'status' => $campaign->status,
      'total_posts' => $campaign->scheduledPosts->count(),
      'published_posts' => 0,
      'pending_posts' => 0,
      'failed_posts' => 0,
      'total_engagement' => 0,
      'engagement_by_platform' => [],
      'posts' => [],
    ];

    foreach ($campaign->scheduledPosts as $scheduledPost) {
      // Count by status
      match ($scheduledPost->status) {
        'posted' => $metrics['published_posts']++,
        'pending' => $metrics['pending_posts']++,
        'failed' => $metrics['failed_posts']++,
        default => null,
      };

      // Get post logs for engagement
      foreach ($scheduledPost->postLogs as $log) {
        $engagement = $log->getEngagementMetrics();
        $totalEngagement = array_sum($engagement);

        $metrics['total_engagement'] += $totalEngagement;

        if (!isset($metrics['engagement_by_platform'][$log->platform])) {
          $metrics['engagement_by_platform'][$log->platform] = 0;
        }
        $metrics['engagement_by_platform'][$log->platform] += $totalEngagement;

        $metrics['posts'][] = [
          'id' => $log->id,
          'platform' => $log->platform,
          'content' => substr($log->content, 0, 100),
          'engagement' => $engagement,
          'published_at' => $log->published_at,
        ];
      }
    }

    return $metrics;
  }

  /**
   * Pause a campaign
   */
  public function pauseCampaign(int $campaignId): Campaign
  {
    $campaign = Campaign::findOrFail($campaignId);

    // Update all pending scheduled posts
    ScheduledPost::where('campaign_id', $campaignId)
      ->where('status', 'pending')
      ->update(['status' => 'paused']);

    $campaign->update(['status' => 'paused']);

    return $campaign;
  }

  /**
   * Resume a paused campaign
   */
  public function resumeCampaign(int $campaignId): Campaign
  {
    $campaign = Campaign::findOrFail($campaignId);

    // Update all paused scheduled posts
    ScheduledPost::where('campaign_id', $campaignId)
      ->where('status', 'paused')
      ->update(['status' => 'pending']);

    $campaign->update(['status' => 'active']);

    return $campaign;
  }

  /**
   * Delete a campaign and its scheduled posts
   */
  public function deleteCampaign(int $campaignId): bool
  {
    return DB::transaction(function () use ($campaignId) {
      $campaign = Campaign::findOrFail($campaignId);

      // Delete all scheduled posts
      ScheduledPost::where('campaign_id', $campaignId)->delete();

      // Delete campaign
      return $campaign->delete();
    });
  }
}
