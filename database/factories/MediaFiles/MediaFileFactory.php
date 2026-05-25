<?php

namespace Database\Factories\MediaFiles;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MediaFiles\MediaFile>
 */
class MediaFileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = \App\Models\MediaFiles\MediaFile::class;

    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'workspace_id' => \App\Models\Workspace\Workspace::factory(),
            'file_name' => fake()->word() . '.mp4',
            'file_path' => 'media/' . fake()->uuid() . '.mp4',
            'file_type' => 'video',
            'mime_type' => 'video/mp4',
            'size' => fake()->numberBetween(1024 * 1024, 50 * 1024 * 1024), // 1MB to 50MB
            'duration' => fake()->numberBetween(10, 300), // 10 seconds to 5 minutes
            'status' => 'completed',
        ];
    }

    public function image(): static
    {
        return $this->state(fn (array $attributes) => [
            'file_name' => fake()->word() . '.jpg',
            'file_path' => 'media/' . fake()->uuid() . '.jpg',
            'file_type' => 'image',
            'mime_type' => 'image/jpeg',
            'duration' => null,
        ]);
    }

    public function video(): static
    {
        return $this->state(fn (array $attributes) => [
            'file_name' => fake()->word() . '.mp4',
            'file_path' => 'media/' . fake()->uuid() . '.mp4',
            'file_type' => 'video',
            'mime_type' => 'video/mp4',
            'duration' => fake()->numberBetween(10, 300),
        ]);
    }
}

