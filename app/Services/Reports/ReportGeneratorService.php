<?php

namespace App\Services\Reports;

use App\Models\Reports\ScheduledReport;
use App\Models\Publications\Publication;
use App\Models\Campaigns\Campaign;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportGeneratorService
{
    public function generateReport(ScheduledReport $report): array
    {
        return match ($report->type) {
            'publications' => $this->generatePublicationsReport($report),
            'analytics' => $this->generateAnalyticsReport($report),
            'campaigns' => $this->generateCampaignsReport($report),
            default => throw new \InvalidArgumentException("Unknown report type: {$report->type}"),
        };
    }

    protected function generatePublicationsReport(ScheduledReport $report): array
    {
        $dateRange = $this->getDateRange($report->frequency);
        $filters = $report->filters ?? [];

        $query = Publication::where('workspace_id', $report->workspace_id)
            ->whereBetween('created_at', $dateRange);

        if (isset($filters['status'])) {
            $query->whereIn('status', $filters['status']);
        }

        $publications = $query->with(['user', 'socialPostLogs'])->get();

        return [
            'period' => $this->getPeriodLabel($report->frequency),
            'total_publications' => $publications->count(),
            'by_status' => $publications->groupBy('status')->map->count(),
            'by_platform' => $this->groupByPlatform($publications),
            'publications' => $publications->map(fn($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'status' => $p->status,
                'created_at' => $p->created_at,
                'platforms' => $p->socialPostLogs->pluck('platform')->unique()->values(),
            ]),
        ];
    }

    protected function generateAnalyticsReport(ScheduledReport $report): array
    {
        $dateRange = $this->getDateRange($report->frequency);

        $analytics = DB::table('campaign_analytics')
            ->join('publications', 'campaign_analytics.publication_id', '=', 'publications.id')
            ->where('publications.workspace_id', $report->workspace_id)
            ->whereBetween('campaign_analytics.created_at', $dateRange)
            ->select(
                DB::raw('SUM(views) as total_views'),
                DB::raw('SUM(clicks) as total_clicks'),
                DB::raw('SUM(conversions) as total_conversions'),
                DB::raw('AVG(engagement_rate) as avg_engagement')
            )
            ->first();

        return [
            'period' => $this->getPeriodLabel($report->frequency),
            'total_views' => $analytics->total_views ?? 0,
            'total_clicks' => $analytics->total_clicks ?? 0,
            'total_conversions' => $analytics->total_conversions ?? 0,
            'avg_engagement_rate' => round($analytics->avg_engagement ?? 0, 2),
        ];
    }

    protected function generateCampaignsReport(ScheduledReport $report): array
    {
        $dateRange = $this->getDateRange($report->frequency);

        $campaigns = Campaign::where('workspace_id', $report->workspace_id)
            ->whereBetween('created_at', $dateRange)
            ->withCount('publications')
            ->get();

        return [
            'period' => $this->getPeriodLabel($report->frequency),
            'total_campaigns' => $campaigns->count(),
            'active_campaigns' => $campaigns->where('status', 'active')->count(),
            'campaigns' => $campaigns->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'status' => $c->status,
                'publications_count' => $c->publications_count,
            ]),
        ];
    }

    protected function getDateRange(string $frequency): array
    {
        return match ($frequency) {
            'daily' => [Carbon::yesterday()->startOfDay(), Carbon::yesterday()->endOfDay()],
            'weekly' => [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()],
            'monthly' => [Carbon::now()->subMonth()->startOfMonth(), Carbon::now()->subMonth()->endOfMonth()],
            default => [Carbon::now()->subDay(), Carbon::now()],
        };
    }

    protected function getPeriodLabel(string $frequency): string
    {
        return match ($frequency) {
            'daily' => 'Yesterday',
            'weekly' => 'Last Week',
            'monthly' => 'Last Month',
            default => 'Custom Period',
        };
    }

    protected function groupByPlatform($publications): array
    {
        $platforms = [];
        foreach ($publications as $publication) {
            foreach ($publication->socialPostLogs as $log) {
                $platforms[$log->platform] = ($platforms[$log->platform] ?? 0) + 1;
            }
        }
        return $platforms;
    }
}
