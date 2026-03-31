<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Workspace\Workspace;
use Illuminate\Console\Command;

class CreateTestWorkspaceCommand extends Command
{
    protected $signature = 'test:create-workspace {--name=Test Workspace}';
    protected $description = 'Create a test workspace for testing purposes';

    public function handle()
    {
        $name = $this->option('name');

        // Crear usuario de prueba si no existe
        $user = User::firstOrCreate(
            ['email' => 'test@contentflow.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        // Crear workspace de prueba
        $workspace = Workspace::firstOrCreate(
            ['name' => $name],
            [
                'creator_id' => $user->id,
                'created_by' => $user->id,
                'slug' => str($name)->slug(),
                'description' => 'Test workspace for idempotency testing',
            ]
        );

        $this->info("✅ Test workspace created:");
        $this->line("   ID: {$workspace->id}");
        $this->line("   Name: {$workspace->name}");
        $this->line("   Creator: {$user->name} ({$user->email})");

        return 0;
    }
}