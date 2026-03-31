<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Services\PlanManagementService;
use Illuminate\Support\Facades\Log;

class ExpireSubscriptionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire subscriptions that have reached their end date';

    /**
     * Create a new command instance.
     */
    public function __construct(
        private PlanManagementService $planManagement
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Checking for expired subscriptions...');
        
        $expiredCount = 0;
        
        // Buscar suscripciones que han expirado
        $expiredSubscriptions = Workspace::whereHas('subscription', function ($query) {
            $query->where('status', 'canceling')
                  ->where('ends_at', '<=', now())
                  ->where('cancel_at_period_end', true);
        })->get();

        $this->info("Found {$expiredSubscriptions->count()} expired subscriptions to process");

        foreach ($expiredSubscriptions as $workspace) {
            $user = $workspace->owner();
            
            if (!$user) {
                $this->warn("Workspace {$workspace->id} has no owner, skipping");
                continue;
            }

            try {
                $previousPlan = $workspace->subscription->plan ?? 'unknown';
                
                $this->info("Processing workspace {$workspace->id} (user {$user->id}): {$previousPlan} -> free");
                
                // Cambiar a plan Free
                $success = $this->planManagement->changePlan(
                    user: $user,
                    newPlan: 'free',
                    reason: 'subscription_expired',
                    metadata: [
                        'workspace_id' => $workspace->id,
                        'expired_at' => now()->toDateTimeString(),
                        'previous_plan' => $previousPlan
                    ]
                );

                if (!$success) {
                    $this->error("Failed to change plan for workspace {$workspace->id}");
                    continue;
                }

                // Actualizar estado de suscripción
                $workspace->subscription->update([
                    'status' => 'expired',
                    'plan' => 'free'
                ]);

                $expiredCount++;
                
                Log::info('Subscription expired and moved to free', [
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'previous_plan' => $previousPlan
                ]);

                $this->info("✓ Successfully expired subscription for workspace {$workspace->id}");

            } catch (\Exception $e) {
                Log::error('Failed to expire subscription', [
                    'workspace_id' => $workspace->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                
                $this->error("✗ Failed to expire subscription for workspace {$workspace->id}: {$e->getMessage()}");
            }
        }

        $this->info("Expired {$expiredCount} subscriptions");
        
        return Command::SUCCESS;
    }
}
