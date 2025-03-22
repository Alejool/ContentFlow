<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\MediaFile;
use App\Models\ScheduledPost;
use App\Models\SocialAccount;
use App\Models\User;

class ScheduledPostFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = ScheduledPost::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'social_account_id' => SocialAccount::factory(),
            'media_file_id' => MediaFile::factory(),
            'caption' => fake()->text(),
            'scheduled_at' => fake()->dateTime(),
            'status' => fake()->randomElement(["pending","posted","failed"]),
        ];
    }
}
