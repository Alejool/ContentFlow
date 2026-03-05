<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subscription\Subscription;
use App\Services\PlanManagementService;
use Illuminate\Support\Facades\Log;

class CheckExpiredGracePeriods extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:check-grace-periods';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and expire grace periods for failed payments';

    /**
     * Execute the console command.
     */
    public function handle(PlanManagementService $planManagement): int
    {
        $this->info('Checking expired grace periods...');

        // Buscar suscripciones en past_due con período de gracia expirado
        $expiredGracePeriods = Subscription::where('status', 'past_due')
            ->whereNotNull('grace_period_ends_at')
            ->where('grace_period_ends_at', '<=', now())
            ->get();

        if ($expiredGracePeriods->isEmpty()) {
            $this->info('No expired grace periods found.');
            return Command::SUCCESS;
        }

        $this->info("Found {$expiredGracePeriods->count()} expired grace periods.");

        foreach ($expiredGracePeriods as $subscription) {
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

                // Cambiar a plan free
                $planManagement->changePlan(
                    user: $user,
                    newPlan: 'free',
                    reason: 'grace_period_expired',
                    metadata: [
                        'previous_plan' => $subscription->plan,
                        'grace_period_ended' => now()->toDateTimeString(),
                    ]
                );

                // Actualizar subscription
                $subscription->update([
                    'status' => 'expired',
                    'plan' => 'free',
                    'grace_period_ends_at' => null,
                    'ends_at' => now(),
                ]);

                $this->info("✓ Expired grace period for workspace {$workspace->id} (user: {$user->email})");

                Log::info('Grace period expired, moved to free plan', [
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'subscription_id' => $subscription->id,
                ]);
            } catch (\Exception $e) {
                $this->error("✗ Failed to process subscription {$subscription->id}: {$e->getMessage()}");
                
                Log::error('Failed to process expired grace period', [
                    'subscription_id' => $subscription->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        $this->info("Processed {$expiredGracePeriods->count()} expired grace periods.");

        return Command::SUCCESS;
    }
}
