<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Publications\Publication;
use App\Models\CampaignAnalytics;
use App\Models\SocialAccount;
use App\Models\SocialMediaMetrics;
use App\Models\Workspace;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class ExistingUserDummyDataSeeder extends Seeder
{
  /**
   * Run the database seeder.
   */
  public function run(): void
  {
    $users = User::all();

    if ($users->isEmpty()) {
      $this->command->error('No users found in the database.');
      return;
    }

    $this->command->info("Found {$users->count()} users. Generating data...");

    // Specific target user logic
    // $targetEmail = 'alejandroolartediaz@gmail.com';
    $targetEmail = 'demo@gmail.com';
    $targetUser = User::where('email', $targetEmail)->first();

    if (!$targetUser) {
      $this->command->info("Creating target user: $targetEmail");
      $targetUser = User::factory()->create([
        'name' => 'Demo User',
        'email' => $targetEmail, // Normalized email
        'password' => bcrypt('password'), // or any default
      ]);
    }

    // Ensure target user is in the loop even if they were just created
    if (!$users->contains('id', $targetUser->id)) {
      $users->push($targetUser);
    }

    foreach ($users as $user) {
      $this->command->info("Processing user: {$user->email}");

      // Ensure user has a workspace (create one if missing or use default)
      $workspaceId = $user->current_workspace_id;
      if (!$workspaceId) {
        $workspace = $user->workspaces()->first();
        if ($workspace) {
          $workspaceId = $workspace->id;
          $user->update(['current_workspace_id' => $workspaceId]);
        } else {
          // Try to Create a default workspace if none exists
          $this->command->warn("User {$user->email} has no workspace. running WorkspaceSeeder for this user...");

          // Create a personal workspace for this user manually since they don't have one
          $workspace = Workspace::create([
            'name' => 'Personal Workspace',
            'slug' => Str::slug($user->name . ' Personal ' . Str::random(4)),
            'created_by' => $user->id,
          ]);

          // Attach implicitly (assuming role pivot existence, or just setting ID for now to pass foreign key checks)
          // If creating a fresh workspace, we should probably attach the user as owner.
          // But for dummy data, setting the ID is crucial for the publications relationship.
          $user->workspaces()->attach($workspace->id, ['role_id' => 1]); // Assuming 1 is Owner or similar, or just attach
          $user->update(['current_workspace_id' => $workspace->id]);
          $workspaceId = $workspace->id;
        }
      }

      $this->createPublicationsAndAnalytics($user, $workspaceId);
      $this->createSocialAccountsAndMetrics($user, $workspaceId);
    }

    $this->command->info('✅ Dummy data generation completed for all users!');
  }

  private function createPublicationsAndAnalytics($user, $workspaceId)
  {
    // Delete existing publications for clean slate (optional, maybe dangerous? keeping it additive for now per request "datos de prueba por cada usuario de lso que ya existen")
    // The user asked "create dummy data... but datso itrreales"
    // I will just add new data.

    $titles = [
      'Summer Sale 2025',
      'Winter Collection Launch',
      'Tech Gadgets Promo',
      'Organic Food Awareness',
      'Fitness Challenge',
      'Black Friday Deal',
      'New Year Resolution'
    ];

    // Create exactly 10 publications per user with richer test data
    $count = 10;

    // Some publications will be grouped into campaigns; use goal field to encode campaign name for compatibility
    $campaignPool = [];

    for ($i = 0; $i < $count; $i++) {
      $title = $titles[array_rand($titles)] . ' - Test ' . Str::random(5);
      $startDate = Carbon::now()->subDays(rand(10, 90));
      $endDate = $startDate->copy()->addDays(rand(7, 60));

      // 40% chance to be part of a campaign grouping
      $isCampaign = rand(1, 100) <= 40;
      $campaignName = null;
      if ($isCampaign) {
        // reuse or create a campaign name
        if (rand(1, 100) <= 60 && !empty($campaignPool)) {
          $campaignName = $campaignPool[array_rand($campaignPool)];
        } else {
          $campaignName = Str::title(Str::random(6)) . ' Campaign';
          $campaignPool[] = $campaignName;
        }
      }

      $goal = $isCampaign ? "Campaign: {$campaignName}" : 'Test Goal for Analytics';
      $description = ($isCampaign ? "Part of campaign {$campaignName}. " : '') . 'Generated test publication for dummy analytics.';

      $publication = Publication::create([
        'user_id' => $user->id,
        'workspace_id' => $workspaceId,
        'title' => $title,
        'slug' => Str::slug($title . '-' . Str::random(4)),
        'status' => 'published',
        'goal' => $goal,
        'description' => $description,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'publish_date' => $startDate,
      ]);

      // Create an activity record for the publication creation if an activities table exists
      try {
        if (Schema::hasTable('activities')) {
          DB::table('activities')->insert([
            'user_id' => $user->id,
            'subject_type' => Publication::class,
            'subject_id' => $publication->id,
            'description' => "Created publication {$publication->title}",
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
          ]);
        }
      } catch (\Throwable $e) {
        // ignore if activity table has different schema
      }

      // Generate Analytics for this publication
      $this->generateCampaignAnalytics($publication, $isCampaign);
    }
  }

  private function generateCampaignAnalytics($publication, $isCampaign = false)
  {
    $currentDate = $publication->start_date->copy();
    $endDate = $publication->end_date->copy()->min(Carbon::now()); // Don't generate future data yet

    // Campaigns tend to have higher baseline
    $baseViews = $isCampaign ? rand(500, 3000) : rand(100, 1000);

    while ($currentDate <= $endDate) {
      $isWeekend = $currentDate->isWeekend();
      $multiplier = $isWeekend ? 0.6 : 1.1;

      // Randomize daily stats
      $views = (int) ($baseViews * $multiplier * (rand(80, 120) / 100));
      $clicks = (int) ($views * (rand(2, 10) / 100));
      $conversions = (int) ($clicks * (rand(5, 20) / 100));
      $likes = (int) ($views * (rand(5, 15) / 100));
      $comments = (int) ($likes * (rand(5, 20) / 100));
      $shares = (int) ($likes * (rand(2, 10) / 100));
      $saves = (int) ($likes * (rand(1, 5) / 100));

      CampaignAnalytics::create([
        'publication_id' => $publication->id, // IMPORTANT: Using publication_id
        'user_id' => $publication->user_id,
        'date' => $currentDate->format('Y-m-d'),
        'views' => $views,
        'clicks' => $clicks,
        'conversions' => $conversions,
        'likes' => $likes,
        'comments' => $comments,
        'shares' => $shares,
        'saves' => $saves,
        'reach' => (int) ($views * (rand(80, 95) / 100)),
        'impressions' => (int) ($views * (rand(110, 140) / 100)),
        'engagement_rate' => $views > 0 ? round((($likes + $comments + $shares + $saves) / $views) * 100, 2) : 0,
        'ctr' => $views > 0 ? round(($clicks / $views) * 100, 2) : 0,
        'conversion_rate' => $clicks > 0 ? round(($conversions / $clicks) * 100, 2) : 0,
      ]);

      $currentDate->addDay();

      // Slightly trend the base views up or down
      $baseViews = $baseViews * (rand(95, 105) / 100);
    }
  }

  private function createSocialAccountsAndMetrics($user, $workspaceId)
  {
    // Read active social platforms from config if available, otherwise fallback
    $platforms = config('social.platforms', ['facebook', 'instagram', 'twitter', 'linkedin']);

    foreach ($platforms as $platform) {
      // Check if account already exists to avoid duplicates
      $account = SocialAccount::firstOrCreate(
        [
          'user_id' => $user->id,
          'workspace_id' => $workspaceId,
          'platform' => $platform
        ],
        [
          'account_id' => 'test_' . $platform . '_' . $user->id,
          'account_name' => "Test $platform Account",
          'access_token' => 'dummy_token',
          'refresh_token' => 'dummy_refresh'
        ]
      );

      // Generate Social Media Metrics for last 90 days
      $this->generateSocialMetrics($account);
    }
  }

  private function generateSocialMetrics($account)
  {
    // Clean up old metrics for this test period to avoid collision if running specific ranges?
    // Or just add new ones? Ideally `firstOrCreate` or just add.
    // For simplicity and preventing Primary Key collisions on (account_id, date) if unique constrained:
    // Let's first check if metrics exist for today.

    $startDate = Carbon::now()->subDays(90);
    $currentDate = $startDate->copy();

    $followers = rand(1000, 50000);

    while ($currentDate <= Carbon::now()) {

      // Check if metric exists
      $exists = SocialMediaMetrics::where('social_account_id', $account->id)
        ->where('date', $currentDate->format('Y-m-d'))
        ->exists();

      if (!$exists) {
        $isWeekend = $currentDate->isWeekend();
        $dailyGrowth = rand(-5, 20); // Can lose followers too
        $followers += $dailyGrowth;
        if ($followers < 0) $followers = 0;

        $posts = $isWeekend ? rand(0, 1) : rand(0, 3);
        $views = rand(100, 500) * ($posts + 1);

        SocialMediaMetrics::create([
          'social_account_id' => $account->id,
          'user_id' => $account->user_id,
          'date' => $currentDate->format('Y-m-d'),
          'followers' => $followers,
          'following' => rand(100, 500),
          'posts_count' => $posts, // Daily posts
          'total_likes' => (int) ($views * 0.1),
          'total_comments' => (int) ($views * 0.05),
          'total_shares' => (int) ($views * 0.02),
          'engagement_rate' => rand(1, 10),
        ]);
      }

      $currentDate->addDay();
    }
  }
}
