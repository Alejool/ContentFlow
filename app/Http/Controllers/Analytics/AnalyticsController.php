<?php

namespace App\Http\Controllers\Analytics;

use App\Models\Analytics;
use App\Services\StatisticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use App\Http\Controllers\Controller;

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
    public function dashboard(Request $request): Response|\Illuminate\Http\RedirectResponse
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

        // Format data for frontend
        $stats = [
            'totalViews' => $overview['total_views'] ?? 0,
            'totalClicks' => $overview['total_clicks'] ?? 0,
            'totalConversions' => $overview['total_conversions'] ?? 0,
            'totalReach' => $overview['total_reach'] ?? 0,
            'totalEngagement' => $overview['total_engagement'] ?? 0,
            'avgEngagementRate' => $overview['avg_engagement_rate'] ?? 0,
            'campaigns' => $campaigns->map(function ($campaign) {
                return [
                    'id' => $campaign['id'],
                    'title' => $campaign['title'],
                    'views' => $campaign['total_views'],
                    'clicks' => $campaign['total_clicks'],
                    'engagement' => $campaign['total_engagement'],
                    'publications' => $campaign['publications'] ?? [], // Pass through nested publications
                ];
            })->toArray(),
            'engagementTrends' => $engagementTrends->map(function ($trend) {
                return [
                    'date' => Carbon::parse($trend['date'])->format('M d'),
                    'views' => $trend['views'],
                    'clicks' => $trend['clicks'],
                    'engagement' => $trend['total_engagement'],
                ];
            })->toArray(),
            'platformData' => $socialMedia->map(function ($platform) {
                return [
                    'name' => ucfirst($platform['platform']),
                    'value' => $platform['followers'],
                ];
            })->toArray(),
        ];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'period' => $days,
        ]);
    }

    /**
     * Display the main analytics page
     */
    public function index(Request $request): Response|\Illuminate\Http\RedirectResponse
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

        $stats = $this->statisticsService->getDashboardStats($workspaceId, $days);

        return Inertia::render('Analytics/Index', [
            'stats' => $stats,
            'period' => $days,
        ]);
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

        $socialAccounts = \App\Models\SocialAccount::where('workspace_id', $workspaceId);

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

            // Add headers
            fputcsv($file, ['Metric', 'Value']);

            // Add overview data
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
