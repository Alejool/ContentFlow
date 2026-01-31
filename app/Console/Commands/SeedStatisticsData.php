<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Campaigns\Campaign;
use App\Models\Social\SocialAccount;
use App\Models\Campaigns\CampaignAnalytics;
use App\Models\Social\SocialMediaMetrics;
use Carbon\Carbon;
use Illuminate\Support\Str;

class SeedStatisticsData extends Command
{
    protected $signature = 'statistics:seed';
    protected $description = 'Seed comprehensive statistics data for testing';

    public function handle()
    {
        $this->info('🚀 Starting statistics data seeding...');

        $user = User::first();
        if (!$user) {
            $this->error('❌ No users found. Please create a user first.');
            return 1;
        }

        $this->info("✅ Using user: {$user->email}");

        // Clean existing data
        $this->info('🧹 Cleaning existing test data...');
        CampaignAnalytics::whereIn('campaign_id', Campaign::where('user_id', $user->id)->pluck('id'))->delete();
        SocialMediaMetrics::whereIn('social_account_id', SocialAccount::where('user_id', $user->id)->pluck('id'))->delete();
        Campaign::where('user_id', $user->id)->delete();
        SocialAccount::where('user_id', $user->id)->delete();

        // Create campaigns
        $this->info('📝 Creating campaigns...');
        $campaigns = $this->createCampaigns($user);
        $this->info("✅ Created {$campaigns->count()} campaigns");

        // Create social accounts
        $this->info('📱 Creating social media accounts...');
        $socialAccounts = $this->createSocialAccounts($user);
        $this->info("✅ Created {$socialAccounts->count()} social accounts");

        // Create campaign analytics
        $this->info('📊 Creating campaign analytics...');
        $this->createCampaignAnalytics($campaigns);
        $this->info("✅ Created campaign analytics");

        // Create social media metrics
        $this->info('📈 Creating social media metrics...');
        $this->createSocialMediaMetrics($socialAccounts);
        $this->info("✅ Created social media metrics");

        $this->info('');
        $this->info('🎉 Statistics data seeded successfully!');
        $this->info("📊 Total Campaigns: " . Campaign::count());
        $this->info("📊 Total Social Accounts: " . SocialAccount::count());
        $this->info("📊 Total Campaign Analytics: " . CampaignAnalytics::count());
        $this->info("📊 Total Social Media Metrics: " . SocialMediaMetrics::count());
        $this->info('');
        $this->info('🌐 Visit http://localhost:8000/dashboard to see your statistics!');

        return 0;
    }

    private function createCampaigns($user)
    {
        $campaigns = collect();

        $campaignsData = [
            ['title' => 'Summer Sale 2024', 'days_ago' => 60, 'duration' => 90],
            ['title' => 'Black Friday Mega Sale', 'days_ago' => 45, 'duration' => 60],
            ['title' => 'New Product Launch', 'days_ago' => 30, 'duration' => 90],
            ['title' => 'Holiday Season Campaign', 'days_ago' => 20, 'duration' => 60],
            ['title' => 'Brand Awareness Campaign', 'days_ago' => 10, 'duration' => 90],
        ];

        foreach ($campaignsData as $data) {
            $campaign = Campaign::create([
                'user_id' => $user->id,
                'title' => $data['title'],
                'slug' => Str::slug($data['title']) . '-' . time() . '-' . rand(1000, 9999),
                'status' => 'published',
                'goal' => 'Increase engagement and sales',
                'description' => 'Marketing campaign for ' . $data['title'],
                'hashtags' => '#marketing #campaign #sales',
                'start_date' => Carbon::now()->subDays($data['days_ago'])->format('Y-m-d'),
                'end_date' => Carbon::now()->addDays($data['duration'] - $data['days_ago'])->format('Y-m-d'),
                'publish_date' => Carbon::now()->subDays($data['days_ago'])->format('Y-m-d'),
            ]);

            $campaigns->push($campaign);
        }

        return $campaigns;
    }

    private function createSocialAccounts($user)
    {
        $accounts = collect();
        $platforms = ['facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];

        foreach ($platforms as $platform) {
            $account = SocialAccount::create([
                'user_id' => $user->id,
                'platform' => $platform,
                'account_id' => $platform . '_' . $user->id . '_' . time(),
                'access_token' => Str::random(64),
                'refresh_token' => Str::random(64),
                'token_expires_at' => Carbon::now()->addDays(60),
            ]);

            $accounts->push($account);
        }

        return $accounts;
    }

    private function createCampaignAnalytics($campaigns)
    {
        foreach ($campaigns as $campaign) {
            $startDate = Carbon::parse($campaign->start_date);
            $endDate = min(Carbon::parse($campaign->end_date), Carbon::now());
            $currentDate = $startDate->copy();

            $baseViews = rand(1000, 3000);

            while ($currentDate <= $endDate) {
                $dayOfWeek = $currentDate->dayOfWeek;
                $isWeekend = ($dayOfWeek == 0 || $dayOfWeek == 6);
                $multiplier = $isWeekend ? 0.7 : 1.0;

                $views = (int)($baseViews * $multiplier * (1 + rand(-20, 20) / 100));
                $uniqueVisitors = (int)($views * rand(70, 85) / 100);
                $impressions = (int)($views * rand(150, 250) / 100);
                $reach = (int)($uniqueVisitors * rand(85, 95) / 100);

                $clicks = (int)($views * rand(8, 15) / 100);
                $conversions = (int)($clicks * rand(3, 10) / 100);

                $likes = (int)($views * rand(5, 15) / 100);
                $comments = (int)($likes * rand(15, 30) / 100);
                $shares = (int)($likes * rand(10, 25) / 100);
                $saves = (int)($likes * rand(12, 28) / 100);

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

                $analytics->calculateMetrics()->save();

                $currentDate->addDay();
            }
        }
    }

    private function createSocialMediaMetrics($socialAccounts)
    {
        $platformBases = [
            'facebook' => ['followers' => 12000, 'posts' => 250],
            'instagram' => ['followers' => 18000, 'posts' => 400],
            'twitter' => ['followers' => 8000, 'posts' => 1200],
            'tiktok' => ['followers' => 35000, 'posts' => 150],
            'youtube' => ['followers' => 5000, 'posts' => 80],
        ];

        foreach ($socialAccounts as $account) {
            $base = $platformBases[$account->platform];
            $followers = $base['followers'];
            $postsCount = $base['posts'];

            $startDate = Carbon::now()->subDays(90);
            $currentDate = $startDate->copy();

            while ($currentDate <= Carbon::now()) {
                $dayOfWeek = $currentDate->dayOfWeek;
                $isWeekend = ($dayOfWeek == 0 || $dayOfWeek == 6);

                $followersGained = $isWeekend ? rand(10, 30) : rand(30, 80);
                $followersLost = rand(5, 15);
                $followers += ($followersGained - $followersLost);

                $dailyPosts = $isWeekend ? rand(0, 1) : rand(1, 3);
                $postsCount += $dailyPosts;

                $totalLikes = (int)($followers * rand(8, 18) / 100 * $dailyPosts);
                $totalComments = (int)($totalLikes * rand(8, 18) / 100);
                $totalShares = (int)($totalLikes * rand(5, 12) / 100);
                $totalSaves = (int)($totalLikes * rand(10, 22) / 100);

                $reach = (int)($followers * rand(25, 65) / 100);
                $impressions = (int)($reach * rand(180, 320) / 100);
                $profileViews = (int)($followers * rand(3, 10) / 100);

                $metrics = SocialMediaMetrics::create([
                    'social_account_id' => $account->id,
                    'date' => $currentDate->format('Y-m-d'),
                    'followers' => $followers,
                    'following' => rand(500, 2000),
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
                ]);

                $previousMetrics = SocialMediaMetrics::where('social_account_id', $account->id)
                    ->where('date', '<', $currentDate)
                    ->latest('date')
                    ->first();

                if ($previousMetrics) {
                    $metrics->calculateGrowthRate($previousMetrics->followers);
                }

                $metrics->calculateMetrics()->save();

                $currentDate->addDay();
            }
        }
    }
}
