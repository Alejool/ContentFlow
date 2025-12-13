<?php

namespace Database\Factories;

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
            'name' => $title,
            'status' => $this->faker->randomElement(['active', 'inactive', 'completed', 'deleted', 'paused']),
            'start_date' => $this->faker->dateTimeBetween('-1 month', '+1 month'),
            'end_date' => $this->faker->dateTimeBetween('+1 month', '+3 months'),
            'goal' => $this->faker->sentence,
            'budget' => $this->faker->randomNumber(5),
            'description' => $this->faker->text(200),
        ];
    }
}
