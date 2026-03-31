<?php

namespace App\Http\Controllers\Analytics;

use App\Models\Analytics;
use App\Services\StatisticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use App\Models\Social\SocialAccount;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class AnalyticsController extends Controller
{
    protected $statisticsService;

    public function __construct(StatisticsService $statisticsService)
    {
        $this->statisticsService = $statisticsService;
    }

    /**
     * Display the dashboard with statistics
     */
    public function dashboard(Request $request): Response|RedirectResponse
    {
        $user = Auth::user();
        $workspaceId = $user->current_workspace_id;

        if (!$workspaceId) {
            $workspace = $user->workspaces()->first();
            if ($workspace) {
                $user->update(['current_workspace_id' => $workspace->id]);
                $workspaceId = $workspace->id;
            } else {
                return redirect()->route('workspaces.index');
            }
        }

        $days = (int) $request->input('days', 30);
        $startDate = now()->subDays($days);
        $endDate = now();

        // Get overview stats
        $overview = $this->statisticsService->getOverviewStats($workspaceId, $startDate, $endDate);
        $campaigns = $this->statisticsService->getTopCampaigns($workspaceId, 10);
        $socialMedia = $this->statisticsService->getSocialMediaOverview($workspaceId);
        $engagementTrends = $this->statisticsService->getEngagementTrends($workspaceId, $startDate, $endDate);

        // Detect social accounts that need reconnection or are nearing expiry
        $problematicAccounts = SocialAccount::where('workspace_id', $workspaceId)
            ->where(function ($q) {
                $q->where('failure_count', '>=', 3)
                  ->orWhere('is_active', false)
                  ->orWhere('token_expires_at', '<=', now())              // already expired
                  ->orWhere('token_expires_at', '<=', now()->addDays(7)); // expiring within 7 days
            })
            ->get(['id', 'platform', 'account_name', 'failure_count', 'is_active', 'token_expires_at'])
            ->map(fn ($a) => [
                'id'             => $a->id,
                'platform'       => $a->platform,
                'account_name'   => $a->account_name,
                'reason'         => $a->isTokenExpired() || !$a->is_active
                                        ? ($a->failure_count >= 3 ? 'failures' : 'expired')
                                        : 'expiring_soon',
                'days_remaining' => $a->token_expires_at && !$a->isTokenExpired()
                                        ? (int) ceil($a->token_expires_at->diffInHours(now()) / 24)
                                        : null,
                'token_expires_at' => $a->token_expires_at?->toIso8601String(),
            ])
            ->values()
            ->toArray();


        // Format data for frontend
        $stats = [
            'totalViews' => $overview['total_views'] ?? 0,
            'totalClicks' => $overview['total_clicks'] ?? 0,
            'totalConversions' => $overview['total_conversions'] ?? 0,
            'totalReach' => $overview['total_reach'] ?? 0,
            'totalEngagement' => $overview['total_engagement'] ?? 0,
            'avgEngagementRate' => $overview['avg_engagement_rate'] ?? 0,
            'campaigns' => $campaigns,
            'engagementTrends' => $engagementTrends->map(function ($trend) {
                return [
                    'date' => Carbon::parse($trend['date'])->format('M d'),
                    'views' => $trend['views'],
                    'clicks' => $trend['clicks'],
                    'engagement' => $trend['total_engagement'],
                    'likes' => $trend['likes'],
                    'comments' => $trend['comments'],
                    'shares' => $trend['shares'],
                    'saves' => $trend['saves'],
                ];
            })->toArray(),
            'platformData' => $socialMedia,
            'platformComparison' => $this->statisticsService->getPlatformComparison($workspaceId, $days),
        ];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'period' => $days,
            'problematicAccounts' => $problematicAccounts,
        ]);
    }

    /**
     * Display the main analytics page
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = Auth::user();
        $workspaceId = $user->current_workspace_id;

        if (!$workspaceId) {
            $workspace = $user->workspaces()->first();
            if ($workspace) {
                $user->update(['current_workspace_id' => $workspace->id]);
                $workspaceId = $workspace->id;
            } else {
                return redirect()->route('workspaces.index');
            }
        }

        $days = (int) $request->input('days', 30);
        $startDate = now()->subDays($days);
        $endDate = now();

        $stats = $this->statisticsService->getDashboardStats($workspaceId, $days);

        if (isset($stats['engagement_trends'])) {
            $stats['engagement_trends'] = collect($stats['engagement_trends'])->map(function ($trend) {
                return [
                    'date' => Carbon::parse($trend['date'])->format('M d'),
                    'views' => $trend['views'],
                    'clicks' => $trend['clicks'],
                    'engagement' => $trend['total_engagement'],
                    'likes' => $trend['likes'] ?? 0,
                    'comments' => $trend['comments'] ?? 0,
                    'shares' => $trend['shares'] ?? 0,
                    'saves' => $trend['saves'] ?? 0,
                ];
            })->toArray();
        }

        return Inertia::render('Analytics/Index', [
            'stats' => array_merge($stats, [
                'platformComparison' => $this->statisticsService->getPlatformComparison($workspaceId, $days),
                'detailedPlatforms' => $this->statisticsService->getDetailedPlatformAnalytics($workspaceId, $days),
                'detailedPublications' => $this->statisticsService->getDetailedPublicationPerformance($workspaceId, $days),
            ]),
            'period' => $days,
        ]);
    }

    /**
     * JSON endpoint for period-based analytics data (used by frontend without full page reload)
     */
    public function data(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = Auth::user();
        $workspaceId = $user->current_workspace_id;

        if (!$workspaceId) {
            return response()->json(['error' => 'No workspace selected'], 422);
        }

        $days = (int) $request->input('days', 30);

        $stats = $this->statisticsService->getDashboardStats($workspaceId, $days);

        if (isset($stats['engagement_trends'])) {
            $stats['engagement_trends'] = collect($stats['engagement_trends'])->map(function ($trend) {
                return [
                    'date' => \Carbon\Carbon::parse($trend['date'])->format('M d'),
                    'views' => $trend['views'],
                    'clicks' => $trend['clicks'],
                    'engagement' => $trend['total_engagement'],
                    'likes' => $trend['likes'] ?? 0,
                    'comments' => $trend['comments'] ?? 0,
                    'shares' => $trend['shares'] ?? 0,
                    'saves' => $trend['saves'] ?? 0,
                ];
            })->toArray();
        }

        return response()->json(array_merge($stats, [
            'platformComparison' => $this->statisticsService->getPlatformComparison($workspaceId, $days),
            'detailedPlatforms' => $this->statisticsService->getDetailedPlatformAnalytics($workspaceId, $days),
            'detailedPublications' => $this->statisticsService->getDetailedPublicationPerformance($workspaceId, $days),
        ]));
    }

    /**
     * Get dashboard overview statistics
     */
    public function getDashboardStats(Request $request)
    {
        $user = Auth::user();
        $workspaceId = $user->current_workspace_id;
        $days = $request->input('days', 7);

        $startDate = now()->subDays($days);
        $endDate = now();

        $overview = $this->statisticsService->getOverviewStats($workspaceId, $startDate, $endDate);
        $topCampaigns = $this->statisticsService->getTopCampaigns($workspaceId, 3);
        $socialMedia = $this->statisticsService->getSocialMediaOverview($workspaceId);
        $engagementTrends = $this->statisticsService->getEngagementTrends($workspaceId, $startDate, $endDate);

        return response()->json([
            'overview' => $overview,
            'top_campaigns' => $topCampaigns,
            'social_media' => $socialMedia,
            'engagement_trends' => $engagementTrends,
        ]);
    }

    /**
     * Get campaign-specific analytics
     */
    public function getCampaignAnalytics(Request $request, int $campaignId)
    {
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : null;
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : null;

        $analytics = $this->statisticsService->getCampaignAnalytics($campaignId, $startDate, $endDate);

        return response()->json($analytics);
    }

    /**
     * Get social media platform metrics
     */
    public function getSocialMediaMetrics(Request $request)
    {
        $user = Auth::user();
        $workspaceId = $user->current_workspace_id;
        $platform = $request->input('platform');
        $days = $request->input('days', 30);

        $startDate = now()->subDays($days);
        $endDate = now();

        $socialAccounts = SocialAccount::where('workspace_id', $workspaceId);

        if ($platform) {
            $socialAccounts->where('platform', $platform);
        }

        $metrics = $socialAccounts->get()->map(function ($account) use ($startDate, $endDate) {
            return [
                'platform' => $account->platform,
                'metrics' => $this->statisticsService->getSocialMediaMetrics($account->id, $startDate, $endDate),
            ];
        });

        return response()->json($metrics);
    }

    /**
     * Get engagement trends data
     */
    public function getEngagementData(Request $request)
    {
        $user = Auth::user();
        $workspaceId = $user->current_workspace_id;
        $days = $request->input('days', 30);

        $startDate = now()->subDays($days);
        $endDate = now();

        $trends = $this->statisticsService->getEngagementTrends($workspaceId, $startDate, $endDate);

        return response()->json($trends);
    }

    /**
     * Get platform comparison data
     */
    public function getPlatformComparison(Request $request)
    {
        $user = Auth::user();
        $workspaceId = $user->current_workspace_id;

        $comparison = $this->statisticsService->getPlatformComparison($workspaceId);

        return response()->json($comparison);
    }

    /**
     * Trigger an on-demand analytics sync for the current workspace.
     * Rate-limited to once every 15 minutes per workspace.
     */
    public function sync(Request $request): \Illuminate\Http\JsonResponse
    {
        $user        = Auth::user();
        $workspaceId = $user->current_workspace_id;

        if (!$workspaceId) {
            return response()->json(['error' => 'No workspace selected'], 422);
        }

        $cacheKey = "analytics_sync_lock:workspace:{$workspaceId}";
        $ttl      = 15 * 60; // 15 minutes

        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            $remaining = \Illuminate\Support\Facades\Cache::get($cacheKey . ':remaining', $ttl);
            return response()->json([
                'error'             => 'Sync already in progress or recently completed.',
                'retry_after_seconds' => $remaining,
            ], 429);
        }

        // Lock for 15 minutes
        \Illuminate\Support\Facades\Cache::put($cacheKey, true, $ttl);
        \Illuminate\Support\Facades\Cache::put($cacheKey . ':remaining', $ttl, $ttl);

        $accounts = \App\Models\Social\SocialAccount::where('workspace_id', $workspaceId)
            ->where('is_active', true)
            ->get();

        if ($accounts->isEmpty()) {
            \Illuminate\Support\Facades\Cache::forget($cacheKey);
            return response()->json(['message' => 'No active social accounts to sync.', 'dispatched' => 0]);
        }

        $jobs = $accounts->map(fn ($account) => new \App\Jobs\SyncSocialAnalyticsJob($account, 7));

        \Illuminate\Support\Facades\Bus::batch($jobs->toArray())
            ->name("Manual Sync — Workspace {$workspaceId}")
            ->allowFailures()
            ->dispatch();

        return response()->json([
            'message'    => 'Sync started.',
            'dispatched' => $accounts->count(),
            'locked_for_seconds' => $ttl,
        ]);
    }

    /**
     * Return how many seconds until the next manual sync is allowed.
     */
    public function syncStatus(Request $request): \Illuminate\Http\JsonResponse
    {
        $workspaceId = Auth::user()->current_workspace_id;
        $cacheKey    = "analytics_sync_lock:workspace:{$workspaceId}";

        $locked = \Illuminate\Support\Facades\Cache::has($cacheKey);

        return response()->json([
            'locked'              => $locked,
            'retry_after_seconds' => $locked
                ? \Illuminate\Support\Facades\Cache::get($cacheKey . ':remaining', 0)
                : 0,
        ]);
    }

    /**
     * Store analytics data (for API integrations)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'metric_type' => 'required|string',
            'metric_name' => 'required|string',
            'metric_value' => 'required|numeric',
            'metric_date' => 'required|date',
            'platform' => 'nullable|string',
            'reference_id' => 'nullable|integer',
            'reference_type' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $analytics = Analytics::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->current_workspace_id,
            ...$validated,
        ]);


        return response()->json($analytics, 201);
    }

    /**
     * Export statistics data
     */
    public function exportData(Request $request)
    {
        $user = Auth::user();
        $workspaceId = $user->current_workspace_id;
        $format = $request->input('format', 'json'); // json, csv
        $days = $request->input('days', 30);

        $stats = $this->statisticsService->getDashboardStats($workspaceId, $days);

        if ($format === 'csv') {
            // Implement CSV export
            return $this->exportToCsv($stats);
        }

        return response()->json($stats);
    }

    /**
     * Helper method to export to CSV
     */
    private function exportToCsv($data)
    {
        $filename = 'analytics_' . now()->format('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($data) {
            $file = fopen('php://output', 'w');

            fputcsv($file, ['Metric', 'Value']);

            foreach ($data['overview'] as $key => $value) {
                if (!is_array($value)) {
                    fputcsv($file, [$key, $value]);
                }
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
