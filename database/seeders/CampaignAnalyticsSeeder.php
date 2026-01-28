<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CampaignAnalytics;
use App\Models\Campaign;
use Carbon\Carbon;

class CampaignAnalyticsSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $campaigns = Campaign::all();

        if ($campaigns->isEmpty()) {
            $this->command->warn('No campaigns found. Please seed campaigns first.');
            return;
        }

        foreach ($campaigns as $campaign) {
            // Generate 90 days of analytics data
            $startDate = Carbon::parse($campaign->start_date ?? now()->subDays(90));
            $endDate = Carbon::parse($campaign->end_date ?? now());

            $currentDate = $startDate->copy();
            $baseViews = rand(500, 2000);
            $trend = rand(-10, 30); // Growth trend percentage

            while ($currentDate <= $endDate && $currentDate <= now()) {
                // Simulate realistic growth/decline
                $dayOfWeek = $currentDate->dayOfWeek;
                $weekendMultiplier = ($dayOfWeek == 0 || $dayOfWeek == 6) ? 0.7 : 1.0; // Lower on weekends

                $views = (int)($baseViews * $weekendMultiplier * (1 + rand(-20, 20) / 100));
                $uniqueVisitors = (int)($views * rand(60, 80) / 100); // 60-80% unique
                $impressions = (int)($views * rand(120, 200) / 100); // Impressions > views
                $reach = (int)($uniqueVisitors * rand(80, 95) / 100);

                // Engagement metrics
                $clicks = (int)($views * rand(5, 15) / 100); // 5-15% CTR
                $conversions = (int)($clicks * rand(2, 8) / 100); // 2-8% conversion

                $likes = (int)($views * rand(3, 12) / 100);
                $comments = (int)($likes * rand(10, 30) / 100);
                $shares = (int)($likes * rand(5, 20) / 100);
                $saves = (int)($likes * rand(8, 25) / 100);

                $analytics = CampaignAnalytics::create([
                    'campaign_id' => $campaign->id,
                    'date' => $currentDate->format('Y-m-d'),
                    'views' => $views,
                    'unique_visitors' => $uniqueVisitors,
                    'clicks' => $clicks,
                    'conversions' => $conversions,
                    'likes' => $likes,
                    'comments' => $comments,
                    'shares' => $shares,
                    'saves' => $saves,
                    'reach' => $reach,
                    'impressions' => $impressions,
                ]);

                // Calculate and save metrics
                $analytics->calculateMetrics()->save();

                // Apply trend for next day
                $baseViews = (int)($baseViews * (1 + $trend / 100 / 90));

                $currentDate->addDay();
            }
        }

        $this->command->info('Campaign analytics seeded successfully!');
    }
}
