<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\Analytics;
use App\Models\CampaignAnalytics;
use App\Models\SocialMediaMetrics;
use App\Models\Publications\Publication;
use App\Models\SocialAccount;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
  /**
   * Get comprehensive dashboard statistics
   */
  public function getDashboardStats(int $workspaceId, int $days = 30)
  {
    $startDate = now()->subDays($days);
    $endDate = now();

    return [
      'overview' => $this->getOverviewStats($workspaceId, $startDate, $endDate),
      'campaigns' => $this->getTopCampaigns($workspaceId, 5),
      'social_media' => $this->getSocialMediaOverview($workspaceId),
      'engagement_trends' => $this->getEngagementTrends($workspaceId, $startDate, $endDate),
      'recent_activity' => $this->getRecentActivity($workspaceId, 10),
    ];
  }

  /**
   * Get overview KPI statistics
   */
  public function getOverviewStats(int $workspaceId, $startDate, $endDate)
  {
    $publications = Publication::where('workspace_id', $workspaceId)->pluck('id');

    $currentPeriod = CampaignAnalytics::whereIn('publication_id', $publications)
      ->whereBetween('date', [$startDate, $endDate])
      ->selectRaw('
                SUM(views) as total_views,
                SUM(clicks) as total_clicks,
                SUM(conversions) as total_conversions,
                SUM(reach) as total_reach,
                SUM(impressions) as total_impressions,
                SUM(likes + comments + shares + saves) as total_engagement,
                AVG(engagement_rate) as avg_engagement_rate,
                AVG(ctr) as avg_ctr,
                AVG(conversion_rate) as avg_conversion_rate
            ')
      ->first();

    // Previous period for comparison
    $previousStart = Carbon::parse($startDate)->subDays($endDate->diffInDays($startDate));
    $previousEnd = Carbon::parse($startDate)->subDay();

    $previousPeriod = CampaignAnalytics::whereIn('publication_id', $publications)
      ->whereBetween('date', [$previousStart, $previousEnd])
      ->selectRaw('
                SUM(views) as total_views,
                SUM(clicks) as total_clicks,
                SUM(conversions) as total_conversions,
                SUM(reach) as total_reach,
                SUM(impressions) as total_impressions,
                SUM(likes + comments + shares + saves) as total_engagement
            ')
      ->first();

    return [
      'total_views' => $currentPeriod->total_views ?? 0,
      'total_clicks' => $currentPeriod->total_clicks ?? 0,
      'total_conversions' => $currentPeriod->total_conversions ?? 0,
      'total_reach' => $currentPeriod->total_reach ?? 0,
      'total_impressions' => $currentPeriod->total_impressions ?? 0,
      'total_engagement' => $currentPeriod->total_engagement ?? 0,
      'avg_engagement_rate' => round($currentPeriod->avg_engagement_rate ?? 0, 2),
      'avg_ctr' => round($currentPeriod->avg_ctr ?? 0, 2),
      'avg_conversion_rate' => round($currentPeriod->avg_conversion_rate ?? 0, 2),
      'changes' => [
        'views' => $this->calculateChange($previousPeriod->total_views ?? 0, $currentPeriod->total_views ?? 0),
        'clicks' => $this->calculateChange($previousPeriod->total_clicks ?? 0, $currentPeriod->total_clicks ?? 0),
        'conversions' => $this->calculateChange($previousPeriod->total_conversions ?? 0, $currentPeriod->total_conversions ?? 0),
        'engagement' => $this->calculateChange($previousPeriod->total_engagement ?? 0, $currentPeriod->total_engagement ?? 0),
      ],
    ];
  }

  /**
   * Get performing campaigns with aggregated stats and nested publications
   */
  public function getTopCampaigns(int $workspaceId, int $limit = 5)
  {
    // 1. Get all campaigns for the workspace with their publications and analytics
    $campaigns = Campaign::where('workspace_id', $workspaceId)
      ->with(['publications.analytics'])
      ->get();

    $performanceData = $campaigns->map(function ($campaign) {
      $totalViews = 0;
      $totalClicks = 0;
      $totalConversions = 0;
      $totalEngagement = 0;
      $publicationStats = [];

      foreach ($campaign->publications as $publication) {
        // Aggregate analytics for this publication
        $pubAnalytics = $publication->analytics()
          ->selectRaw('
                        SUM(views) as total_views,
                        SUM(clicks) as total_clicks,
                        SUM(conversions) as total_conversions,
                        SUM(likes + comments + shares + saves) as total_engagement,
                        AVG(engagement_rate) as avg_engagement_rate
                    ')
          ->first();

        $views = intval($pubAnalytics->total_views ?? 0);
        $clicks = intval($pubAnalytics->total_clicks ?? 0);
        $conversions = intval($pubAnalytics->total_conversions ?? 0);
        $engagement = intval($pubAnalytics->total_engagement ?? 0);

        $totalViews += $views;
        $totalClicks += $clicks;
        $totalConversions += $conversions;
        $totalEngagement += $engagement;

        $publicationStats[] = [
          'id' => $publication->id,
          'title' => $publication->title,
          'views' => $views,
          'clicks' => $clicks,
          'conversions' => $conversions,
          'engagement' => $engagement,
          'avg_engagement_rate' => round($pubAnalytics->avg_engagement_rate ?? 0, 2),
        ];
      }

      return [
        'id' => $campaign->id,
        'title' => $campaign->name,
        'status' => $campaign->status,
        'total_views' => $totalViews,
        'total_clicks' => $totalClicks,
        'total_conversions' => $totalConversions,
        'total_engagement' => $totalEngagement,
        'publications' => $publicationStats,
      ];
    });

    // 2. Handle standalone publications (those not in any campaign)
    $standalonePublications = Publication::where('workspace_id', $workspaceId)
      ->whereDoesntHave('campaigns')
      ->with('analytics')
      ->get();

    if ($standalonePublications->isNotEmpty()) {
      $standaloneStats = [];
      $sViews = 0;
      $sClicks = 0;
      $sConv = 0;
      $sEng = 0;

      foreach ($standalonePublications as $pub) {
        $pubAnalytics = $pub->analytics()
          ->selectRaw('
                        SUM(views) as total_views,
                        SUM(clicks) as total_clicks,
                        SUM(conversions) as total_conversions,
                        SUM(likes + comments + shares + saves) as total_engagement,
                        AVG(engagement_rate) as avg_engagement_rate
                    ')
          ->first();

        $views = intval($pubAnalytics->total_views ?? 0);
        $clicks = intval($pubAnalytics->total_clicks ?? 0);
        $conversions = intval($pubAnalytics->total_conversions ?? 0);
        $engagement = intval($pubAnalytics->total_engagement ?? 0);

        $sViews += $views;
        $sClicks += $clicks;
        $sConv += $conversions;
        $sEng += $engagement;

        $standaloneStats[] = [
          'id' => $pub->id,
          'title' => $pub->title,
          'views' => $views,
          'clicks' => $clicks,
          'conversions' => $conversions,
          'engagement' => $engagement,
          'avg_engagement_rate' => round($pubAnalytics->avg_engagement_rate ?? 0, 2),
        ];
      }

      $performanceData->push([
        'id' => 0, // Virtual ID for standalone
        'title' => 'Standalone Publications',
        'status' => 'active',
        'total_views' => $sViews,
        'total_clicks' => $sClicks,
        'total_conversions' => $sConv,
        'total_engagement' => $sEng,
        'publications' => $standaloneStats,
      ]);
    }

    return $performanceData
      ->sortByDesc('total_engagement')
      ->take($limit)
      ->values();
  }

  /**
   * Get social media overview
   */
  public function getSocialMediaOverview(int $workspaceId)
  {
    $socialAccounts = SocialAccount::where('workspace_id', $workspaceId)->get();

    return $socialAccounts->map(function ($account) {
      $latestMetrics = $account->getLatestMetrics();
      $followerGrowth = $account->getFollowerGrowth(30);

      return [
        'platform' => $account->platform,
        'followers' => $latestMetrics->followers ?? 0,
        'engagement_rate' => round($latestMetrics->engagement_rate ?? 0, 2),
        'follower_growth_30d' => $followerGrowth,
        'total_posts' => $latestMetrics->posts_count ?? 0,
        'reach' => $latestMetrics->reach ?? 0,
        'impressions' => $latestMetrics->impressions ?? 0,
      ];
    });
  }

  /**
   * Get engagement trends over time
   */
  public function getEngagementTrends(int $workspaceId, $startDate, $endDate)
  {
    $publications = Publication::where('workspace_id', $workspaceId)->pluck('id');

    return CampaignAnalytics::whereIn('publication_id', $publications)
      ->whereBetween('date', [$startDate, $endDate])
      ->selectRaw('
                date,
                SUM(likes) as likes,
                SUM(comments) as comments,
                SUM(shares) as shares,
                SUM(saves) as saves,
                SUM(views) as views,
                SUM(clicks) as clicks
            ')
      ->groupBy('date')
      ->orderBy('date')
      ->get()
      ->map(function ($item) {
        return [
          'date' => $item->date->format('Y-m-d'),
          'likes' => $item->likes,
          'comments' => $item->comments,
          'shares' => $item->shares,
          'saves' => $item->saves,
          'views' => $item->views,
          'clicks' => $item->clicks,
          'total_engagement' => $item->likes + $item->comments + $item->shares + $item->saves,
        ];
      });
  }

  /**
   * Get campaign-specific analytics
   */
  public function getCampaignAnalytics(int $campaignId, $startDate = null, $endDate = null)
  {
    $query = CampaignAnalytics::where('publication_id', $campaignId);

    if ($startDate && $endDate) {
      $query->whereBetween('date', [$startDate, $endDate]);
    }

    $analytics = $query->orderBy('date')->get();

    return [
      'daily_data' => $analytics,
      'totals' => [
        'views' => $analytics->sum('views'),
        'clicks' => $analytics->sum('clicks'),
        'conversions' => $analytics->sum('conversions'),
        'engagement' => $analytics->sum(function ($item) {
          return $item->likes + $item->comments + $item->shares + $item->saves;
        }),
        'reach' => $analytics->sum('reach'),
        'impressions' => $analytics->sum('impressions'),
      ],
      'averages' => [
        'engagement_rate' => round($analytics->avg('engagement_rate'), 2),
        'ctr' => round($analytics->avg('ctr'), 2),
        'conversion_rate' => round($analytics->avg('conversion_rate'), 2),
      ],
    ];
  }

  /**
   * Get social media platform metrics
   */
  public function getSocialMediaMetrics(int $socialAccountId, $startDate = null, $endDate = null)
  {
    $query = SocialMediaMetrics::where('social_account_id', $socialAccountId);

    if ($startDate && $endDate) {
      $query->whereBetween('date', [$startDate, $endDate]);
    }

    return $query->orderBy('date')->get();
  }

  /**
   * Get recent activity
   */
  public function getRecentActivity(int $workspaceId, int $limit = 10)
  {
    $publications = Publication::where('workspace_id', $workspaceId)
      ->latest()
      ->take($limit)
      ->get()
      ->map(function ($campaign) {
        return [
          'type' => 'campaign',
          'title' => $campaign->title,
          'status' => $campaign->status,
          'date' => $campaign->created_at,
          'data' => [
            'views' => $campaign->getTotalViews(),
            'clicks' => $campaign->getTotalClicks(),
          ],
        ];
      });

    return $publications;
  }

  /**
   * Calculate percentage change
   */
  private function calculateChange($previous, $current)
  {
    if ($previous == 0) {
      return $current > 0 ? 100 : 0;
    }

    return round((($current - $previous) / $previous) * 100, 2);
  }

  /**
   * Get platform comparison data
   */
  public function getPlatformComparison(int $workspaceId)
  {
    $socialAccounts = SocialAccount::where('workspace_id', $workspaceId)->get();

    return $socialAccounts->map(function ($account) {
      $metrics = $account->metrics()
        ->whereBetween('date', [now()->subDays(30), now()])
        ->get();

      return [
        'platform' => $account->platform,
        'total_engagement' => $metrics->sum(function ($m) {
          return $m->total_likes + $m->total_comments + $m->total_shares + $m->total_saves;
        }),
        'avg_engagement_rate' => round($metrics->avg('engagement_rate'), 2),
        'total_reach' => $metrics->sum('reach'),
        'follower_growth' => ($metrics->isNotEmpty())
          ? ($metrics->last()->followers - $metrics->first()->followers)
          : 0,
      ];
    });
  }
}
