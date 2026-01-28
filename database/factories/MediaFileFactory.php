<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Collection;
use App\Models\MediaFile;
use App\Models\User;

class MediaFileFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = MediaFile::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'collection_id' => Collection::factory(),
            'file_name' => fake()->word(),
            'file_path' => fake()->word(),
            'file_type' => fake()->randomElement(["image","video"]),
            'mime_type' => fake()->word(),
            'size' => fake()->numberBetween(-10000, 10000),
        ];
    }
}
