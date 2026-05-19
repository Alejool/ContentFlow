<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Campaigns\Campaign;
use App\Models\Social\SocialAccount;
use Illuminate\Support\Str;
use Carbon\Carbon;

class CompleteTestDataSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $this->command->info('Creating comprehensive test data...');

        // Get first user
        $user = User::first();
        if (!$user) {
            $this->command->error('No users found. Please create a user first.');
            return;
        }

        $this->command->info('Using user: ' . $user->email);

        // Delete existing test campaigns to avoid duplicates
        Campaign::where('user_id', $user->id)->delete();

        // Create multiple campaigns with proper date formatting
        $campaignsData = [
            [
                'title' => 'Summer Sale 2024',
                'slug' => 'summer-sale-2024-' . time(),
                'status' => 'published',
                'goal' => 'Increase sales by 30%',
                'description' => 'Major summer promotion campaign',
                'hashtags' => '#summer #sale #discount',
                'start_date' => Carbon::now()->subDays(60)->format('Y-m-d'),
                'end_date' => Carbon::now()->addDays(30)->format('Y-m-d'),
                'publish_date' => Carbon::now()->subDays(60)->format('Y-m-d'),
                'user_id' => $user->id,
            ],
            [
                'title' => 'Black Friday Mega Sale',
                'slug' => 'black-friday-mega-sale-' . time(),
                'status' => 'published',
                'goal' => 'Record breaking sales',
                'description' => 'Biggest sale of the year',
                'hashtags' => '#blackfriday #sale #deals',
                'start_date' => Carbon::now()->subDays(45)->format('Y-m-d'),
                'end_date' => Carbon::now()->addDays(15)->format('Y-m-d'),
                'publish_date' => Carbon::now()->subDays(45)->format('Y-m-d'),
                'user_id' => $user->id,
            ],
            [
                'title' => 'New Product Launch',
                'slug' => 'new-product-launch-' . time(),
                'status' => 'published',
                'goal' => 'Generate buzz and pre-orders',
                'description' => 'Launching our revolutionary new product',
                'hashtags' => '#newproduct #innovation #launch',
                'start_date' => Carbon::now()->subDays(30)->format('Y-m-d'),
                'end_date' => Carbon::now()->addDays(60)->format('Y-m-d'),
                'publish_date' => Carbon::now()->subDays(30)->format('Y-m-d'),
                'user_id' => $user->id,
            ],
            [
                'title' => 'Holiday Season Campaign',
                'slug' => 'holiday-season-campaign-' . time(),
                'status' => 'published',
                'goal' => 'Boost holiday sales',
                'description' => 'Special holiday promotions',
                'hashtags' => '#holiday #christmas #gifts',
                'start_date' => Carbon::now()->subDays(20)->format('Y-m-d'),
                'end_date' => Carbon::now()->addDays(40)->format('Y-m-d'),
                'publish_date' => Carbon::now()->subDays(20)->format('Y-m-d'),
                'user_id' => $user->id,
            ],
            [
                'title' => 'Brand Awareness Campaign',
                'slug' => 'brand-awareness-campaign-' . time(),
                'status' => 'published',
                'goal' => 'Increase brand recognition',
                'description' => 'Building brand presence across platforms',
                'hashtags' => '#brand #awareness #marketing',
                'start_date' => Carbon::now()->subDays(10)->format('Y-m-d'),
                'end_date' => Carbon::now()->addDays(80)->format('Y-m-d'),
                'publish_date' => Carbon::now()->subDays(10)->format('Y-m-d'),
                'user_id' => $user->id,
            ],
        ];

        foreach ($campaignsData as $data) {
            Campaign::create($data);
        }

        $this->command->info('✅ Created 5 campaigns');

        // Delete existing social accounts to avoid duplicates
        SocialAccount::where('user_id', $user->id)->delete();

        // Create social media accounts
        $platforms = ['facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];

        foreach ($platforms as $platform) {
            SocialAccount::create([
                'user_id' => $user->id,
                'platform' => $platform,
                'account_id' => $platform . '_' . $user->id . '_' . time(),
                'access_token' => Str::random(64),
                'refresh_token' => Str::random(64),
                'token_expires_at' => Carbon::now()->addDays(60),
            ]);
        }

        $this->command->info('✅ Created 5 social media accounts');

        // Now seed analytics for all campaigns
        $this->call(CampaignAnalyticsSeeder::class);

        // Seed social media metrics
        $this->call(SocialMediaMetricsSeeder::class);

        $this->command->info('✅ Complete test data created successfully!');
        $this->command->info('📊 Campaigns: ' . Campaign::count());
        $this->command->info('📊 Social Accounts: ' . SocialAccount::count());
        $this->command->info('📊 You can now view statistics at /dashboard and /analytics');
    }
}
