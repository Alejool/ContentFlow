<?php

namespace App\Console\Commands;

use App\Models\Analytics\AnalyticsRollup;
use App\Models\Campaigns\CampaignAnalytics;
use App\Models\Social\SocialMediaMetrics;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RollupAnalyticsCommand extends Command
{
    protected $signature = 'analytics:rollup
                            {--dry-run : Show what would be aggregated without making changes}
                            {--days=90 : Keep raw data for this many days (default: 90)}
                            {--force : Skip confirmation prompt}';

    protected $description = 'Aggregate old analytics into weekly/monthly rollups and prune raw records';

    public function handle(): int
    {
        $keepDays  = (int) $this->option('days');
        $isDryRun  = $this->option('dry-run');
        $cutoffRaw = now()->subDays($keepDays)->startOfDay();

        $this->info("Analytics Rollup — keeping raw data for last {$keepDays} days");
        $this->info("Cutoff date: {$cutoffRaw->toDateString()}");

        if ($isDryRun) {
            $this->warn('DRY RUN — no changes will be made');
        }

        // 1. Rollup campaign_analytics → weekly (data between 90 and 365 days old)
        $this->info('');
        $this->info('→ Rolling up campaign analytics (weekly)...');
        $campaignWeekly = $this->rollupCampaignAnalytics($cutoffRaw, 'weekly', $isDryRun);

        // 2. Rollup campaign_analytics → monthly (data older than 365 days)
        $this->info('→ Rolling up campaign analytics (monthly)...');
        $campaignMonthly = $this->rollupCampaignAnalytics(
            now()->subYear()->startOfDay(),
            'monthly',
            $isDryRun,
            $cutoffRaw  // only data older than 365 days
        );

        // 3. Rollup social_media_metrics → weekly
        $this->info('→ Rolling up social media metrics (weekly)...');
        $socialWeekly = $this->rollupSocialMetrics($cutoffRaw, 'weekly', $isDryRun);

        // 4. Rollup social_media_metrics → monthly
        $this->info('→ Rolling up social media metrics (monthly)...');
        $socialMonthly = $this->rollupSocialMetrics(
            now()->subYear()->startOfDay(),
            'monthly',
            $isDryRun,
            $cutoffRaw
        );

        // 5. Prune raw data
        if (!$isDryRun) {
            $this->info('');
            $this->info('→ Pruning raw data older than ' . $cutoffRaw->toDateString() . '...');
            $this->pruneRawData($cutoffRaw);
        }

        $this->info('');
        $this->info('Done.');
        $this->table(
            ['Type', 'Period', 'Rollup rows upserted'],
            [
                ['Campaign Analytics', 'weekly',  $campaignWeekly],
                ['Campaign Analytics', 'monthly', $campaignMonthly],
                ['Social Metrics',     'weekly',  $socialWeekly],
                ['Social Metrics',     'monthly', $socialMonthly],
            ]
        );

        Log::info('analytics:rollup completed', [
            'campaign_weekly'  => $campaignWeekly,
            'campaign_monthly' => $campaignMonthly,
            'social_weekly'    => $socialWeekly,
            'social_monthly'   => $socialMonthly,
            'dry_run'          => $isDryRun,
        ]);

        return 0;
    }

    /**
     * Aggregate campaign_analytics rows into rollup table.
     *
     * @param Carbon $olderThan  Only aggregate rows older than this date
     * @param string $periodType 'weekly' | 'monthly'
     * @param bool   $isDryRun
     * @param Carbon|null $newerThan  Upper bound (for monthly: skip rows already in weekly range)
     */
    private function rollupCampaignAnalytics(
        Carbon $olderThan,
        string $periodType,
        bool $isDryRun,
        ?Carbon $newerThan = null
    ): int {
        $truncFn = $periodType === 'weekly' ? "DATE_TRUNC('week', date)" : "DATE_TRUNC('month', date)";

        $query = DB::table('campaign_analytics')
            ->where('date', '<', $olderThan)
            ->selectRaw("
                publication_id,
                platform,
                {$truncFn} AS period_start,
                SUM(views)       AS views,
                SUM(clicks)      AS clicks,
                SUM(conversions) AS conversions,
                SUM(reach)       AS reach,
                SUM(impressions) AS impressions,
                SUM(likes)       AS likes,
                SUM(comments)    AS comments,
                SUM(shares)      AS shares,
                SUM(saves)       AS saves,
                AVG(engagement_rate) AS avg_engagement_rate,
                COUNT(*)         AS data_points
            ")
            ->groupByRaw("publication_id, platform, {$truncFn}");

        if ($newerThan) {
            $query->where('date', '>=', $newerThan);
        }

        $rows = $query->get();

        if ($isDryRun) {
            $this->line("  Would upsert {$rows->count()} {$periodType} rollup rows for campaign_analytics");
            return $rows->count();
        }

        $upserted = 0;
        foreach ($rows as $row) {
            $periodStart = Carbon::parse($row->period_start);
            $periodEnd   = $periodType === 'weekly'
                ? $periodStart->copy()->endOfWeek()
                : $periodStart->copy()->endOfMonth();

            AnalyticsRollup::updateOrCreate(
                [
                    'entity_type'  => 'publication',
                    'entity_id'    => $row->publication_id,
                    'period_type'  => $periodType,
                    'period_start' => $periodStart->toDateString(),
                    'platform'     => $row->platform,
                ],
                [
                    'period_end'          => $periodEnd->toDateString(),
                    'views'               => $row->views,
                    'clicks'              => $row->clicks,
                    'conversions'         => $row->conversions,
                    'reach'               => $row->reach,
                    'impressions'         => $row->impressions,
                    'likes'               => $row->likes,
                    'comments'            => $row->comments,
                    'shares'              => $row->shares,
                    'saves'               => $row->saves,
                    'avg_engagement_rate' => round($row->avg_engagement_rate, 2),
                    'data_points'         => $row->data_points,
                ]
            );
            $upserted++;
        }

        return $upserted;
    }

    /**
     * Aggregate social_media_metrics rows into rollup table.
     */
    private function rollupSocialMetrics(
        Carbon $olderThan,
        string $periodType,
        bool $isDryRun,
        ?Carbon $newerThan = null
    ): int {
        $truncFn = $periodType === 'weekly' ? "DATE_TRUNC('week', date)" : "DATE_TRUNC('month', date)";

        $query = DB::table('social_media_metrics')
            ->where('date', '<', $olderThan)
            ->selectRaw("
                social_account_id,
                {$truncFn} AS period_start,
                MAX(followers)   AS followers_end,
                MIN(followers)   AS followers_start,
                SUM(total_likes)    AS likes,
                SUM(total_comments) AS comments,
                SUM(total_shares)   AS shares,
                SUM(total_saves)    AS saves,
                SUM(reach)          AS reach,
                SUM(impressions)    AS impressions,
                SUM(followers_gained) AS followers_gained,
                SUM(followers_lost)   AS followers_lost,
                AVG(engagement_rate)  AS avg_engagement_rate,
                COUNT(*)              AS data_points
            ")
            ->groupByRaw("social_account_id, {$truncFn}");

        if ($newerThan) {
            $query->where('date', '>=', $newerThan);
        }

        $rows = $query->get();

        if ($isDryRun) {
            $this->line("  Would upsert {$rows->count()} {$periodType} rollup rows for social_media_metrics");
            return $rows->count();
        }

        $upserted = 0;
        foreach ($rows as $row) {
            $periodStart = Carbon::parse($row->period_start);
            $periodEnd   = $periodType === 'weekly'
                ? $periodStart->copy()->endOfWeek()
                : $periodStart->copy()->endOfMonth();

            // Net follower growth stored in views field for social rollups
            $followerGrowth = ($row->followers_end ?? 0) - ($row->followers_start ?? 0);

            AnalyticsRollup::updateOrCreate(
                [
                    'entity_type'  => 'social_account',
                    'entity_id'    => $row->social_account_id,
                    'period_type'  => $periodType,
                    'period_start' => $periodStart->toDateString(),
                    'platform'     => null,
                ],
                [
                    'period_end'          => $periodEnd->toDateString(),
                    'views'               => $followerGrowth,   // repurposed: net follower growth
                    'clicks'              => $row->followers_gained,
                    'conversions'         => $row->followers_lost,
                    'reach'               => $row->reach,
                    'impressions'         => $row->impressions,
                    'likes'               => $row->likes,
                    'comments'            => $row->comments,
                    'shares'              => $row->shares,
                    'saves'               => $row->saves,
                    'avg_engagement_rate' => round($row->avg_engagement_rate, 2),
                    'data_points'         => $row->data_points,
                ]
            );
            $upserted++;
        }

        return $upserted;
    }

    private function pruneRawData(Carbon $cutoff): void
    {
        $campaignDeleted = CampaignAnalytics::where('date', '<', $cutoff)->delete();
        $this->line("  Deleted {$campaignDeleted} rows from campaign_analytics");

        $socialDeleted = SocialMediaMetrics::where('date', '<', $cutoff)->delete();
        $this->line("  Deleted {$socialDeleted} rows from social_media_metrics");
    }
}
