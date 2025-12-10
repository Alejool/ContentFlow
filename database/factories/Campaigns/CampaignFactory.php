<?php

namespace Database\Factories\Campaigns;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Campaign;

class CampaignFactory extends Factory
{
    protected $model = Campaign::class;
    public function definition(): array
    {
        $title = $this->faker->sentence(3);

        return [
            'user_id' => User::factory(),
            'title' => $title,
            'slug' => Str::slug($title),
            'image' => $this->faker->imageUrl(800, 400),
            'status' => $this->faker->randomElement(['draft', 'published']),
            'start_date' => $this->faker->dateTimeBetween('-1 month', '+1 month'),
            'end_date' => $this->faker->dateTimeBetween('+1 month', '+3 months'),
            'publish_date' => $this->faker->dateTimeBetween('-1 week', 'now'),
            'goal' => $this->faker->sentence,
            'body' => $this->faker->paragraphs(3, true),
            'url' => $this->faker->url,
            'hashtags' => '#' . $this->faker->word . ' #' . $this->faker->word,
            'description' => $this->faker->text(200),
        ];
    }
}
