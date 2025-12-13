<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Campaign   ;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Faker\Factory as Faker; // Importar la clase Factory de Faker


class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    // database/seeders/DatabaseSeeder.php
    public function run()
    {
        // Desactivar restricciones temporalmente
        Schema::disableForeignKeyConstraints();

        // Eliminar datos existentes
        Campaign::truncate();
        User::truncate();

        // Crear usuarios
        $users = User::factory(20)->create();

        // Crear campañas asignando usuarios existentes
        foreach ($users as $user) {
            Campaign::factory(rand(2, 5))->create(['user_id' => $user->id]);
        }

        // Usuario de prueba con campañas
        $testUser = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com'
        ]);

        Campaign::factory(3)->create([
            'user_id' => $testUser->id,
            'status' => 'active'
        ]);

        // Reactivar restricciones
        Schema::enableForeignKeyConstraints();
    }
}
