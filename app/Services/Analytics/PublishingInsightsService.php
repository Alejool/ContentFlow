<?php

namespace App\Services\Analytics;

use App\Models\Social\SocialPostLog;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Derives actionable publishing recommendations from the workspace's real
 * posting history (SocialPostLog): best hour and weekday to publish, the
 * platform and format that convert best, and the week-over-week trend.
 * Pure aggregation over local data - no external calls.
 */
class PublishingInsightsService
{
    private const LOOKBACK_DAYS = 90;

    public function forWorkspace(int $workspaceId): array
    {
        $logs = SocialPostLog::query()
            ->where('workspace_id', $workspaceId)
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '>=', now()->subDays(self::LOOKBACK_DAYS))
            ->get(['published_at', 'platform', 'post_type', 'engagement_data']);

        if ($logs->isEmpty()) {
            return [
                'has_data' => false,
                'sample_size' => 0,
                'insights' => [],
            ];
        }

        return [
            'has_data' => true,
            'sample_size' => $logs->count(),
            'insights' => array_values(array_filter([
                $this->bestHour($logs),
                $this->bestWeekday($logs),
                $this->bestPlatform($logs),
                $this->bestFormat($logs),
                $this->weekTrend($logs),
            ])),
        ];
    }

    private function engagementOf(mixed $engagementData): int
    {
        if (!is_array($engagementData)) {
            return 0;
        }

        $total = 0;
        foreach (['likes', 'comments', 'shares', 'views', 'clicks', 'impressions'] as $key) {
            $total += (int) ($engagementData[$key] ?? 0);
        }

        return $total;
    }

    /**
     * Group logs by a key and return [key, avg_engagement, count] for the
     * best-performing group with at least 2 samples (falls back to most used).
     */
    private function bestGroup(Collection $logs, callable $keyFn): ?array
    {
        $groups = $logs->groupBy($keyFn)->map(function (Collection $group) {
            $engagement = $group->sum(fn ($log) => $this->engagementOf($log->engagement_data));

            return [
                'count' => $group->count(),
                'avg_engagement' => $group->count() > 0 ? round($engagement / $group->count(), 1) : 0,
            ];
        });

        if ($groups->isEmpty()) {
            return null;
        }

        $withEngagement = $groups->filter(fn ($g) => $g['avg_engagement'] > 0 && $g['count'] >= 2);
        $pool = $withEngagement->isNotEmpty() ? $withEngagement : $groups;

        $bestKey = $pool->sortByDesc(fn ($g) => [$g['avg_engagement'], $g['count']])->keys()->first();

        return [
            'key' => $bestKey,
            'count' => $groups[$bestKey]['count'],
            'avg_engagement' => $groups[$bestKey]['avg_engagement'],
        ];
    }

    private function bestHour(Collection $logs): ?array
    {
        $best = $this->bestGroup($logs, fn ($log) => Carbon::parse($log->published_at)->format('H'));

        if ($best === null) {
            return null;
        }

        return [
            'type' => 'best_hour',
            'value' => (int) $best['key'],
            'label' => sprintf('%02d:00', (int) $best['key']),
            'sample_size' => $best['count'],
            'avg_engagement' => $best['avg_engagement'],
        ];
    }

    private function bestWeekday(Collection $logs): ?array
    {
        $best = $this->bestGroup($logs, fn ($log) => (string) Carbon::parse($log->published_at)->dayOfWeekIso);

        if ($best === null) {
            return null;
        }

        return [
            'type' => 'best_weekday',
            'value' => (int) $best['key'], // 1 = Monday ... 7 = Sunday
            'sample_size' => $best['count'],
            'avg_engagement' => $best['avg_engagement'],
        ];
    }

    private function bestPlatform(Collection $logs): ?array
    {
        $platforms = $logs->pluck('platform')->filter()->unique();
        if ($platforms->count() < 2) {
            return null; // nothing to compare
        }

        $best = $this->bestGroup($logs, fn ($log) => (string) $log->platform);

        if ($best === null) {
            return null;
        }

        return [
            'type' => 'best_platform',
            'value' => $best['key'],
            'sample_size' => $best['count'],
            'avg_engagement' => $best['avg_engagement'],
        ];
    }

    private function bestFormat(Collection $logs): ?array
    {
        $formats = $logs->pluck('post_type')->filter()->unique();
        if ($formats->count() < 2) {
            return null;
        }

        $best = $this->bestGroup($logs->filter(fn ($log) => $log->post_type), fn ($log) => (string) $log->post_type);

        if ($best === null) {
            return null;
        }

        return [
            'type' => 'best_format',
            'value' => $best['key'],
            'sample_size' => $best['count'],
            'avg_engagement' => $best['avg_engagement'],
        ];
    }

    private function weekTrend(Collection $logs): ?array
    {
        $thisWeek = $logs->filter(fn ($log) => Carbon::parse($log->published_at)->gte(now()->subDays(7)))->count();
        $previousWeek = $logs->filter(function ($log) {
            $at = Carbon::parse($log->published_at);

            return $at->gte(now()->subDays(14)) && $at->lt(now()->subDays(7));
        })->count();

        if ($thisWeek === 0 && $previousWeek === 0) {
            return null;
        }

        return [
            'type' => 'week_trend',
            'value' => $previousWeek > 0
                ? (int) round((($thisWeek - $previousWeek) / $previousWeek) * 100)
                : null,
            'this_week' => $thisWeek,
            'previous_week' => $previousWeek,
        ];
    }
}
