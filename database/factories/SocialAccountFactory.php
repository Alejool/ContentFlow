<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\SocialAccount;
use App\Models\User;

class SocialAccountFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = SocialAccount::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'platform' => fake()->randomElement(["facebook","instagram","tiktok","twitter","youtube"]),
            'account_id' => fake()->word(),
            'access_token' => fake()->text(),
            'refresh_token' => fake()->text(),
            'token_expires_at' => fake()->dateTime(),
        ];
    }
}
