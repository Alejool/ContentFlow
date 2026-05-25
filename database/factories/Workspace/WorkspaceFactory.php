<?php

namespace Database\Factories\Workspace;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Workspace\Workspace>
 */
class WorkspaceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->company() . ' Workspace',
            'slug' => $this->faker->unique()->slug(),
            'description' => $this->faker->sentence(),
            'timezone' => 'UTC',
            'created_by' => \App\Models\User::factory(),
            'public' => false,
            'allow_public_invites' => false,
        ];
    }
}

