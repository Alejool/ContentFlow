<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Models\Subscription\Subscription;
use App\Services\WorkspaceUsageService;

class EnsureWorkspaceSubscriptions extends Command
{
    protected $signature = 'subscriptions:ensure-workspace-subscriptions';
    protected $description = 'Ensure all workspaces have a subscription record with free plan by default';

    public function __construct(
        private WorkspaceUsageService $usageService
    ) {
        parent::__construct();
    }

    public function handle()
    {
        $this->info('Checking workspaces for subscriptions...');
        
        $workspaces = Workspace::all();
        $created = 0;
        $updated = 0;

        foreach ($workspaces as $workspace) {
            // Verificar si ya tiene suscripción en la tabla de Cashier
            $existingSubscription = $workspace->subscriptions()
                ->where('type', 'default')
                ->first();
            
            if (!$existingSubscription) {
                // Obtener el owner del workspace
                $owner = $workspace->creator;
                
                if (!$owner) {
                    $this->warn("⚠ Workspace '{$workspace->name}' has no owner, skipping...");
                    continue;
                }
                
                // Crear suscripción free por defecto usando Cashier
                // Cashier requiere user_id, así que usamos el owner
                $subscription = Subscription::create([
                    'user_id' => $owner->id, // Owner del workspace
                    'workspace_id' => $workspace->id,
                    'type' => 'default',
                    'stripe_id' => 'free_' . $workspace->id,
                    'stripe_status' => 'active',
                    'plan' => 'free',
                    'status' => 'active',
                ]);
                
                // Inicializar métricas de uso
                $this->initializeUsageMetrics($workspace);
                
                $created++;
                $this->info("✓ Created free subscription for workspace: {$workspace->name} (Owner: {$owner->name})");
            } else {
                // Verificar que tenga métricas de uso
                $this->ensureUsageMetrics($workspace);
                $updated++;
            }
        }

        $this->newLine();
        $this->info("Summary:");
        $this->info("- Subscriptions created: {$created}");
        $this->info("- Workspaces updated: {$updated}");
        $this->info("- Total workspaces: " . $workspaces->count());
        
        return 0;
    }

    private function initializeUsageMetrics(Workspace $workspace): void
    {
        $limits = $workspace->getPlanLimits();
        
        // Métricas mensuales
        $monthlyMetrics = [
            'publications_per_month',
            'ai_requests_per_month',
        ];
        
        foreach ($monthlyMetrics as $metric) {
            $workspace->usageMetrics()->updateOrCreate(
                [
                    'metric_type' => $metric,
                    'period_start' => now()->startOfMonth(),
                    'period_end' => now()->endOfMonth(),
                ],
                [
                    'current_usage' => 0,
                    'limit' => $limits[$metric] ?? 0,
                ]
            );
        }
    }

    private function ensureUsageMetrics(Workspace $workspace): void
    {
        $limits = $workspace->getPlanLimits();
        
        // Verificar métricas del mes actual
        $monthlyMetrics = [
            'publications_per_month',
            'ai_requests_per_month',
        ];
        
        foreach ($monthlyMetrics as $metric) {
            $exists = $workspace->usageMetrics()
                ->where('metric_type', $metric)
                ->where('period_start', '<=', now())
                ->where('period_end', '>=', now())
                ->exists();
            
            if (!$exists) {
                $workspace->usageMetrics()->create([
                    'metric_type' => $metric,
                    'current_usage' => 0,
                    'limit' => $limits[$metric] ?? 0,
                    'period_start' => now()->startOfMonth(),
                    'period_end' => now()->endOfMonth(),
                ]);
            }
        }
    }
}
