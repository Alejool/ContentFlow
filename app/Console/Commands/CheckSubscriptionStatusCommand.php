<?php

namespace App\Console\Commands;

use App\Models\Subscription\Subscription;
use App\Services\Subscription\GracePeriodManager;
use App\Services\Subscription\PlanValidator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckSubscriptionStatusCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscription:check-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check subscription statuses: validate expired subscriptions, process expired grace periods, and send expiration warnings';

    /**
     * Execute the console command.
     */
    public function handle(PlanValidator $planValidator, GracePeriodManager $gracePeriodManager): int
    {
        $this->info('Starting subscription status check...');

        // 1. Validate expired subscriptions and trigger downgrades where needed
        $this->info('Validating expired subscriptions...');
        $this->validateExpiredSubscriptions($planValidator);

        // 2. Process workspaces whose grace period has expired
        $this->info('Processing expired grace periods...');
        try {
            $gracePeriodManager->processExpiredGracePeriods();
            $this->info('✓ Expired grace periods processed.');
        } catch (\Exception $e) {
            $this->error('✗ Error processing expired grace periods: ' . $e->getMessage());
            Log::error('CheckSubscriptionStatusCommand: processExpiredGracePeriods failed', [
                'error' => $e->getMessage(),
            ]);
        }

        // 3. Send expiration warnings for grace periods ending within 2 days
        $this->info('Sending grace period expiration warnings...');
        try {
            $gracePeriodManager->sendExpirationWarnings();
            $this->info('✓ Expiration warnings sent.');
        } catch (\Exception $e) {
            $this->error('✗ Error sending expiration warnings: ' . $e->getMessage());
            Log::error('CheckSubscriptionStatusCommand: sendExpirationWarnings failed', [
                'error' => $e->getMessage(),
            ]);
        }

        $this->info('Subscription status check completed.');

        return Command::SUCCESS;
    }

    /**
     * Validate all expired subscriptions (ends_at in the past, not in grace period)
     * and execute downgrades where required.
     */
    private function validateExpiredSubscriptions(PlanValidator $planValidator): void
    {
        $expiredSubscriptions = Subscription::query()
            ->whereNotNull('ends_at')
            ->where('ends_at', '<', now())
            ->where('plan', '!=', 'free')
            ->with('workspace')
            ->get();

        if ($expiredSubscriptions->isEmpty()) {
            $this->info('No expired subscriptions found.');
            return;
        }

        $this->info("Found {$expiredSubscriptions->count()} expired subscription(s) to validate.");

        foreach ($expiredSubscriptions as $subscription) {
            $workspace = $subscription->workspace;

            if (! $workspace) {
                $this->warn("Subscription {$subscription->id} has no associated workspace, skipping.");
                continue;
            }

            try {
                $result = $planValidator->validate($workspace);

                if ($result->requiresDowngrade && ! $result->hasError) {
                    $this->info("Downgrading workspace {$workspace->id} (reason: {$result->reason})...");
                    $downgradeResult = $planValidator->executeDowngrade($workspace, $result->reason ?? 'subscription_expired');

                    if ($downgradeResult->hasError) {
                        $this->error("✗ Downgrade failed for workspace {$workspace->id}: {$downgradeResult->errorMessage}");
                    } else {
                        $this->info("✓ Workspace {$workspace->id} downgraded to free plan.");
                    }
                }
            } catch (\Exception $e) {
                $this->error("✗ Error validating workspace {$workspace->id}: {$e->getMessage()}");
                Log::error('CheckSubscriptionStatusCommand: validate failed', [
                    'workspace_id' => $workspace->id,
                    'subscription_id' => $subscription->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
