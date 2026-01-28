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
        $topics = [
            'tech' => ['#laravel', '#php', '#javascript', '#react', '#vue', '#docker', '#aws', '#coding', '#webdev', '#developer'],
            'marketing' => ['#marketing', '#seo', '#contentmarketing', '#digitalmarketing', '#socialmedia', '#branding', '#growth', '#startup'],
            'news' => ['#news', '#tech', '#update', '#release', '#announcement', '#trending', '#innovation'],
            'design' => ['#design', '#ui', '#ux', '#webdesign', '#creative', '#art', '#graphicdesign'],
            'productivity' => ['#productivity', '#tips', '#worklife', '#remote', '#agile', '#scrum', '#management']
        ];

        $selectedTopic = $this->faker->randomElement(array_keys($topics));
        $hashtags = collect($this->faker->randomElements($topics[$selectedTopic], mt_rand(2, 5)))->implode(' ');

        $status = $this->faker->randomElement(['draft', 'draft', 'published', 'scheduled', 'pending_review', 'approved', 'rejected']);

        $platformSettings = [];
        if ($this->faker->boolean(70)) {
            $platformSettings = [
                'twitter' => ['thread' => $this->faker->boolean(20)],
                'linkedin' => ['article' => $this->faker->boolean(10)],
                'instagram' => ['reel' => $this->faker->boolean(30)],
            ];
        }

        $created = $this->faker->dateTimeBetween('-3 months', 'now');
        $published = $status === 'published' ? $this->faker->dateTimeBetween($created, 'now') : null;
        $scheduled = $status === 'scheduled' ? $this->faker->dateTimeBetween('now', '+1 month') : null;

        return [
            'user_id' => User::factory(),
            'title' => $this->faker->realText(50),
            'slug' => $this->faker->slug(),
            'image' => $this->faker->imageUrl(),
            'status' => $status,
            'platform_settings' => is_array($platformSettings) ? $platformSettings : [], // Ensure array
            'start_date' => $created,
            'end_date' => $this->faker->dateTimeBetween($created, '+2 months'),
            'publish_date' => $published,
            'scheduled_at' => $scheduled,
            'body' => $this->faker->paragraphs(mt_rand(2, 6), true),
            'url' => $this->faker->url(),
            'hashtags' => $hashtags,
            'description' => $this->faker->realText(160),
            'created_at' => $created,
            'updated_at' => $this->faker->dateTimeBetween($created, 'now'),
        ];
    }
}
