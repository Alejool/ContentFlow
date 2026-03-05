<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\SubscriptionTrackingService;
use Illuminate\Support\Facades\DB;

class SyncSubscriptionHistory extends Command
{
    protected $signature = 'subscription:sync-history {--user-id=} {--force}';
    protected $description = 'Sync subscription history from Subscription model to SubscriptionHistory';

    public function __construct(
        private SubscriptionTrackingService $trackingService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $userId = $this->option('user-id');
        $force = $this->option('force');

        if ($userId) {
            $users = User::where('id', $userId)->get();
        } else {
            $users = User::all();
        }

        $this->info("Syncing subscription history for {$users->count()} users...");
        $bar = $this->output->createProgressBar($users->count());

        $synced = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($users as $user) {
            try {
                // Check if user already has active subscription history
                $hasActiveHistory = $user->subscriptionHistory()->where('is_active', true)->exists();

                if ($hasActiveHistory && !$force) {
                    $skipped++;
                    $bar->advance();
                    continue;
                }

                // Get workspace subscription (old system)
                $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
                
                if (!$workspace || !$workspace->subscription) {
                    // No subscription found, create free plan
                    $this->trackingService->recordPlanChange(
                        user: $user,
                        newPlan: 'free',
                        previousPlan: null,
                        stripePriceId: null,
                        price: 0,
                        billingCycle: 'monthly',
                        reason: 'auto_sync'
                    );
                    $synced++;
                } else {
                    $subscription = $workspace->subscription;
                    $plan = $subscription->plan ?? 'free';
                    $planConfig = config("plans.{$plan}");

                    // Record plan in new system
                    $this->trackingService->recordPlanChange(
                        user: $user,
                        newPlan: $plan,
                        previousPlan: null,
                        stripePriceId: $subscription->stripe_price ?? null,
                        price: $planConfig['price'] ?? 0,
                        billingCycle: 'monthly',
                        reason: 'auto_sync',
                        metadata: [
                            'synced_from_subscription_id' => $subscription->id,
                            'stripe_id' => $subscription->stripe_id,
                            'stripe_status' => $subscription->stripe_status,
                        ]
                    );
                    $synced++;
                }

                $bar->advance();
            } catch (\Exception $e) {
                $errors++;
                $this->error("\nError syncing user {$user->id}: " . $e->getMessage());
                $bar->advance();
            }
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("Sync completed!");
        $this->table(
            ['Status', 'Count'],
            [
                ['Synced', $synced],
                ['Skipped', $skipped],
                ['Errors', $errors],
            ]
        );

        return 0;
    }
}
