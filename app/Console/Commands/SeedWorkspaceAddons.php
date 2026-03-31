<?php

namespace App\Console\Commands;

use App\Models\Workspace;
use App\Models\WorkspaceAddon;
use Illuminate\Console\Command;

class SeedWorkspaceAddons extends Command
{
    protected $signature = 'addons:seed {workspace_id?}';
    protected $description = 'Seed workspace addons with sample data';

    public function handle()
    {
        $workspaceId = $this->argument('workspace_id');
        
        if ($workspaceId) {
            $workspace = Workspace::find($workspaceId);
        } else {
            $workspace = Workspace::first();
        }

        if (!$workspace) {
            $this->error('No workspace found');
            return 1;
        }

        $this->info("Creating sample addons for workspace: {$workspace->id}");

        // Limpiar addons existentes
        WorkspaceAddon::where('workspace_id', $workspace->id)->delete();

        // Crear addons de ejemplo (múltiples compras del mismo tipo)
        $addons = [
            ['sku' => 'ai_500', 'type' => 'ai_credits', 'amount' => 500, 'used' => 120, 'price' => 39.99, 'days_ago' => 25],
            ['sku' => 'ai_500', 'type' => 'ai_credits', 'amount' => 500, 'used' => 80, 'price' => 39.99, 'days_ago' => 15],
            ['sku' => 'ai_1000', 'type' => 'ai_credits', 'amount' => 1000, 'used' => 450, 'price' => 69.99, 'days_ago' => 30],
            ['sku' => 'storage_50gb', 'type' => 'storage', 'amount' => 50, 'used' => 12, 'price' => 19.99, 'days_ago' => 20],
            ['sku' => 'storage_50gb', 'type' => 'storage', 'amount' => 50, 'used' => 8, 'price' => 19.99, 'days_ago' => 10],
            ['sku' => 'posts_100', 'type' => 'publications', 'amount' => 100, 'used' => 45, 'price' => 17.99, 'days_ago' => 8],
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

        $this->info('Created ' . count($addons) . ' sample addons');

        // Mostrar resumen agrupado
        $grouped = WorkspaceAddon::where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->selectRaw('addon_sku, SUM(total_amount) as total_amount, SUM(used_amount) as total_used, COUNT(*) as count')
            ->groupBy('addon_sku')
            ->get();

        $this->newLine();
        $this->info('Summary by SKU:');
        $this->table(
            ['SKU', 'Total Amount', 'Total Used', 'Available', 'Purchases'],
            $grouped->map(fn($g) => [
                $g->addon_sku,
                $g->total_amount,
                $g->total_used,
                $g->total_amount - $g->total_used,
                $g->count,
            ])
        );

        return 0;
    }
}
