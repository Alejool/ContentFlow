<?php

namespace Database\Seeders\Publications;

use App\Models\User;
use App\Models\Publications\Publication;
use Illuminate\Database\Seeder;

class PublicationSeeder extends Seeder
{
    public function run(): void
    {
        User::all()->each(function ($user) {
            Publication::factory(10)->create([
                'user_id' => $user->id,
            ]);
        });
    }
}