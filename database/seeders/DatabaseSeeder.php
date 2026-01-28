<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Publications\Publication;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;


class DatabaseSeeder extends Seeder
{
  /**
   * Seed the application's database.
   */
  // database/seeders/DatabaseSeeder.php
  public function run()
  {
    // Schema::disableForeignKeyConstraints();

    User::factory(10)
      ->has(Publication::factory()->count(10))
      ->create();

    // Schema::enableForeignKeyConstraints();
  }
}
