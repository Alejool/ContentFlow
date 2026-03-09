<?php

namespace Database\Seeders;

use App\Models\Workspace;
use App\Models\WorkspaceAddon;
use Illuminate\Database\Seeder;

class WorkspaceAddonsSeeder extends Seeder
{
    public function run(): void
    {
        $workspace = Workspace::first();

        if (!$workspace) {
            $this->command->warn('No workspace found. Skipping addon seeding.');
            return;
        }

        $this->command->info("Seeding addons for workspace: {$workspace->id}");

        // Limpiar addons existentes
        WorkspaceAddon::where('workspace_id', $workspace->id)->delete();

        // Crear addons de ejemplo (múltiples compras del mismo tipo se suman)
        $addons = [
            // Dos compras de 500 créditos IA = 1000 total
            ['sku' => 'ai_500', 'type' => 'ai_credits', 'amount' => 500, 'used' => 120, 'price' => 39.99, 'days_ago' => 25],
            ['sku' => 'ai_500', 'type' => 'ai_credits', 'amount' => 500, 'used' => 80, 'price' => 39.99, 'days_ago' => 15],
            
            // Una compra de 1000 créditos IA
            ['sku' => 'ai_1000', 'type' => 'ai_credits', 'amount' => 1000, 'used' => 450, 'price' => 69.99, 'days_ago' => 30],
            
            // Dos compras de 50GB storage = 100GB total
            ['sku' => 'storage_50gb', 'type' => 'storage', 'amount' => 50, 'used' => 12, 'price' => 19.99, 'days_ago' => 20],
            ['sku' => 'storage_50gb', 'type' => 'storage', 'amount' => 50, 'used' => 8, 'price' => 19.99, 'days_ago' => 10],
            
            // Una compra de 100 publicaciones
            ['sku' => 'posts_100', 'type' => 'publications', 'amount' => 100, 'used' => 45, 'price' => 17.99, 'days_ago' => 8],
            
            // Una compra de 10 miembros
            ['sku' => 'members_10', 'type' => 'team_members', 'amount' => 10, 'used' => 7, 'price' => 24.99, 'days_ago' => 19],
        ];

        foreach ($addons as $addon) {
            WorkspaceAddon::create([
                'workspace_id' => $workspace->id,
                'addon_sku' => $addon['sku'],
                'addon_type' => $addon['type'],
                'quantity' => 1,
                'total_amount' => $addon['amount'],
                'used_amount' => $addon['used'],
                'price_paid' => $addon['price'],
                'purchased_at' => now()->subDays($addon['days_ago']),
                'is_active' => true,
            ]);
        }

        $this->command->info('✓ Created ' . count($addons) . ' sample addons');
        
        // Mostrar resumen
        $this->command->newLine();
        $this->command->info('Expected grouped results:');
        $this->command->info('- ai_500: 1000 total (2 purchases)');
        $this->command->info('- ai_1000: 1000 total (1 purchase)');
        $this->command->info('- storage_50gb: 100 total (2 purchases)');
        $this->command->info('- posts_100: 100 total (1 purchase)');
        $this->command->info('- members_10: 10 total (1 purchase)');
    }
}
