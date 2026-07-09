<?php

namespace Database\Factories\Social;

use App\Models\Social\SocialAccount;
use App\Models\Social\SocialPostLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Social\SocialPostLog>
 */
class SocialPostLogFactory extends Factory
{
    protected $model = SocialPostLog::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'social_account_id' => SocialAccount::factory(),
            'platform' => fake()->randomElement(['facebook', 'instagram', 'tiktok', 'twitter', 'youtube']),
            'account_name' => fake()->userName(),
            'platform_post_id' => fake()->uuid(),
            'post_type' => 'post',
            'post_url' => fake()->url(),
            'content' => fake()->sentence(),
            'status' => 'published',
            'published_at' => now(),
        ];
    }
}
