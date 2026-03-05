<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subscription\Subscription;
use App\Services\PlanManagementService;
use Illuminate\Support\Facades\Log;

class ApplyScheduledPlanChanges extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:apply-scheduled-changes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Apply scheduled plan changes (downgrades) that are due';

    /**
     * Execute the console command.
     */
    public function handle(PlanManagementService $planManagement): int
    {
        $this->info('Checking scheduled plan changes...');

        // Buscar suscripciones con cambios de plan programados
        $scheduledChanges = Subscription::whereNotNull('pending_plan')
            ->whereNotNull('plan_changes_at')
            ->where('plan_changes_at', '<=', now())
            ->get();

        if ($scheduledChanges->isEmpty()) {
            $this->info('No scheduled plan changes found.');
            return Command::SUCCESS;
        }

        $this->info("Found {$scheduledChanges->count()} scheduled plan changes.");

        foreach ($scheduledChanges as $subscription) {
            try {
                $workspace = $subscription->workspace;
                
                if (!$workspace) {
                    $this->warn("Workspace not found for subscription {$subscription->id}");
                    continue;
                }

                $user = $workspace->owner();
                
                if (!$user) {
                    $this->warn("Owner not found for workspace {$workspace->id}");
                    continue;
                }

                $oldPlan = $subscription->plan;
                $newPlan = $subscription->pending_plan;

                // Aplicar el cambio de plan
                $planManagement->changePlan(
                    user: $user,
                    newPlan: $newPlan,
                    reason: 'scheduled_downgrade_applied',
                    metadata: [
                        'previous_plan' => $oldPlan,
                        'scheduled_at' => $subscription->plan_changes_at->toDateTimeString(),
                        'applied_at' => now()->toDateTimeString(),
                    ]
                );

                // Limpiar campos de programación
                $subscription->update([
                    'plan' => $newPlan,
                    'pending_plan' => null,
                    'plan_changes_at' => null,
                ]);

                $this->info("✓ Applied plan change for workspace {$workspace->id}: {$oldPlan} → {$newPlan}");

                Log::info('Scheduled plan change applied', [
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'old_plan' => $oldPlan,
                    'new_plan' => $newPlan,
                ]);
            } catch (\Exception $e) {
                $this->error("✗ Failed to apply plan change for subscription {$subscription->id}: {$e->getMessage()}");
                
                Log::error('Failed to apply scheduled plan change', [
                    'subscription_id' => $subscription->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        $this->info("Processed {$scheduledChanges->count()} scheduled plan changes.");

        return Command::SUCCESS;
    }
}
