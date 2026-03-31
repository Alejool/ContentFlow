<?php

namespace Database\Factories;

use App\Models\MediaFiles\MediaFile;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class MediaFileFactory extends Factory
{
    protected $model = MediaFile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'workspace_id' => Workspace::factory(),
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
