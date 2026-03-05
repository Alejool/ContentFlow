<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Workspace\Workspace;
use App\Models\Subscription\UsageMetric;

class InitializeWorkspaceSubscriptionsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Inicializando suscripciones para workspaces existentes...');

        $workspaces = Workspace::whereDoesntHave('subscription')->get();

        foreach ($workspaces as $workspace) {
            // Crear suscripción gratuita
            $subscription = $workspace->subscription()->create([
                'user_id' => $workspace->created_by,
                'type' => 'default',
                'stripe_id' => 'free_' . $workspace->id,
                'stripe_status' => 'active',
                'plan' => 'free',
                'status' => 'active',
            ]);

            // Inicializar métricas de uso
            $limits = config('plans.free.limits');

            UsageMetric::create([
                'workspace_id' => $workspace->id,
                'metric_type' => 'publications',
                'current_usage' => 0,
                'limit' => $limits['publications_per_month'],
                'period_start' => now()->startOfMonth(),
                'period_end' => now()->endOfMonth(),
            ]);

            UsageMetric::create([
                'workspace_id' => $workspace->id,
                'metric_type' => 'storage',
                'current_usage' => 0,
                'limit' => $limits['storage_gb'],
                'period_start' => now()->startOfMonth(),
                'period_end' => now()->endOfMonth(),
            ]);

            UsageMetric::create([
                'workspace_id' => $workspace->id,
                'metric_type' => 'ai_requests',
                'current_usage' => 0,
                'limit' => $limits['ai_requests_per_month'],
                'period_start' => now()->startOfMonth(),
                'period_end' => now()->endOfMonth(),
            ]);

            $this->command->info("✓ Workspace '{$workspace->name}' inicializado con plan gratuito");
        }

        $this->command->info("Total: {$workspaces->count()} workspaces inicializados");
    }
}
