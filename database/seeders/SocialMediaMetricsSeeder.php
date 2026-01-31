<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SocialMediaMetrics;
use App\Models\Social\SocialAccount;
use Carbon\Carbon;

class SocialMediaMetricsSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $socialAccounts = SocialAccount::all();

        if ($socialAccounts->isEmpty()) {
            $this->command->warn('No social accounts found. Creating sample data...');
            return;
        }

        foreach ($socialAccounts as $account) {
            // Platform-specific base metrics
            $platformMetrics = $this->getPlatformBaseMetrics($account->platform);

            // Generate 90 days of metrics
            $startDate = now()->subDays(90);
            $currentDate = $startDate->copy();

            $followers = $platformMetrics['base_followers'];
            $postsCount = $platformMetrics['base_posts'];

            while ($currentDate <= now()) {
                $dayOfWeek = $currentDate->dayOfWeek;
                $isWeekend = ($dayOfWeek == 0 || $dayOfWeek == 6);

                // Follower growth (more on weekdays)
                $followersGained = $isWeekend ? rand(5, 20) : rand(15, 50);
                $followersLost = rand(2, 10);
                $followers += ($followersGained - $followersLost);

                // Post activity (varies by platform)
                $dailyPosts = $this->getDailyPosts($account->platform, $isWeekend);
                $postsCount += $dailyPosts;

                // Engagement metrics
                $totalLikes = (int)($followers * rand(5, 15) / 100 * $dailyPosts);
                $totalComments = (int)($totalLikes * rand(5, 15) / 100);
                $totalShares = (int)($totalLikes * rand(3, 10) / 100);
                $totalSaves = (int)($totalLikes * rand(8, 20) / 100);

                // Reach metrics
                $reach = (int)($followers * rand(20, 60) / 100);
                $impressions = (int)($reach * rand(150, 300) / 100);
                $profileViews = (int)($followers * rand(2, 8) / 100);

                $metrics = SocialMediaMetrics::create([
                    'social_account_id' => $account->id,
                    'date' => $currentDate->format('Y-m-d'),
                    'followers' => $followers,
                    'following' => $platformMetrics['following'],
                    'posts_count' => $postsCount,
                    'total_likes' => $totalLikes,
                    'total_comments' => $totalComments,
                    'total_shares' => $totalShares,
                    'total_saves' => $totalSaves,
                    'reach' => $reach,
                    'impressions' => $impressions,
                    'profile_views' => $profileViews,
                    'followers_gained' => $followersGained,
                    'followers_lost' => $followersLost,
                    'platform_data' => $this->getPlatformSpecificData($account->platform),
                ]);

                // Calculate metrics
                $previousDay = SocialMediaMetrics::where('social_account_id', $account->id)
                    ->where('date', '<', $currentDate)
                    ->latest('date')
                    ->first();

                if ($previousDay) {
                    $metrics->calculateGrowthRate($previousDay->followers);
                }

                $metrics->calculateMetrics()->save();

                $currentDate->addDay();
            }
        }

        $this->command->info('Social media metrics seeded successfully!');
    }

    private function getPlatformBaseMetrics($platform)
    {
        $metrics = [
            'facebook' => ['base_followers' => rand(5000, 15000), 'base_posts' => rand(100, 300), 'following' => 0],
            'instagram' => ['base_followers' => rand(8000, 25000), 'base_posts' => rand(200, 500), 'following' => rand(500, 2000)],
            'twitter' => ['base_followers' => rand(3000, 12000), 'base_posts' => rand(500, 1500), 'following' => rand(1000, 3000)],
            'tiktok' => ['base_followers' => rand(10000, 50000), 'base_posts' => rand(50, 200), 'following' => rand(100, 500)],
            'youtube' => ['base_followers' => rand(2000, 8000), 'base_posts' => rand(20, 100), 'following' => 0],
        ];

        return $metrics[$platform] ?? ['base_followers' => 1000, 'base_posts' => 50, 'following' => 100];
    }

    private function getDailyPosts($platform, $isWeekend)
    {
        if ($isWeekend) {
            return rand(0, 1);
        }

        $postsPerDay = [
            'facebook' => rand(0, 2),
            'instagram' => rand(1, 3),
            'twitter' => rand(3, 8),
            'tiktok' => rand(1, 4),
            'youtube' => rand(0, 1),
        ];

        return $postsPerDay[$platform] ?? rand(0, 2);
    }

    private function getPlatformSpecificData($platform)
    {
        $data = [
            'facebook' => [
                'page_likes' => rand(5000, 15000),
                'page_views' => rand(1000, 5000),
                'post_reach' => rand(2000, 8000),
            ],
            'instagram' => [
                'stories_views' => rand(3000, 10000),
                'reels_plays' => rand(5000, 20000),
                'profile_visits' => rand(500, 2000),
            ],
            'twitter' => [
                'tweet_impressions' => rand(10000, 50000),
                'profile_visits' => rand(500, 2000),
                'mentions' => rand(50, 200),
            ],
            'tiktok' => [
                'video_views' => rand(50000, 200000),
                'profile_views' => rand(1000, 5000),
                'shares' => rand(500, 2000),
            ],
            'youtube' => [
                'watch_time_hours' => rand(100, 500),
                'subscribers_gained' => rand(10, 50),
                'average_view_duration' => rand(120, 600),
            ],
        ];

        return $data[$platform] ?? [];
    }
}
