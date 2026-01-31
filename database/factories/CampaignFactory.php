<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Campaigns\Campaign;

class CampaignFactory extends Factory
{
    protected $model = Campaign::class;
    public function definition(): array
    {

        return [
            'user_id' => User::factory(),
            'name' => $this->faker->sentence(3),
            'status' => $this->faker->randomElement(['active', 'inactive', 'completed', 'deleted', 'paused']),
            'start_date' => $this->faker->dateTimeBetween('-1 month', '+1 month'),
            'end_date' => $this->faker->dateTimeBetween('+1 month', '+3 months'),
            'goal' => $this->faker->sentence,
            'budget' => $this->faker->randomNumber(5),
            'description' => $this->faker->text(200),
        ];
    }
}
