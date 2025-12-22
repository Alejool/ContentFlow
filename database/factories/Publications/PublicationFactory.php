<?php
namespace Database\Factories\Publications;

use App\Models\Publications\Publication;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\User;

class PublicationFactory extends Factory
{
    protected $model = Publication::class;

    public function definition(): array
    {
        $title = $this->faker->sentence();
        return [
            'user_id' => User::factory(),
            'title' => $title,
            'slug' => Str::slug($title),
            'image' => $this->faker->imageUrl(),
            'status' => $this->faker->randomElement(['draft', 'published']),
            'platform_settings' => json_encode(['theme' => 'default']),
            'start_date' => now(),
            'end_date' => now()->addDays(30),
            'publish_date' => now(),
            'body' => $this->faker->paragraphs(3, true),
            'url' => $this->faker->url(),
            'hashtags' => '#laravel #docker #php',
            'description' => $this->faker->text(200),
        ];
    }
}