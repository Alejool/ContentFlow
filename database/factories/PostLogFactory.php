<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\PostLog;
use App\Models\Social\ScheduledPost;

class PostLogFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = PostLog::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'scheduled_post_id' => ScheduledPost::factory(),
            'response_message' => fake()->text(),
            'posted_at' => fake()->dateTime(),
        ];
    }
}
