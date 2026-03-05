<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\SubscriptionTrackingService;
use Illuminate\Console\Command;

class InitializeMissingSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:initialize-missing
                            {--dry-run : Run without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Initialize free subscriptions for users who don\'t have any active subscription';

    /**
     * Execute the console command.
     */
    public function handle(SubscriptionTrackingService $subscriptionTracking): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('Running in DRY RUN mode - no changes will be made');
        }

        // Find users without active subscription history
        $usersWithoutSubscription = User::whereDoesntHave('subscriptionHistory', function ($query) {
            $query->where('is_active', true);
        })->get();

        if ($usersWithoutSubscription->isEmpty()) {
            $this->info('All users already have active subscriptions!');
            return Command::SUCCESS;
        }

        $this->info("Found {$usersWithoutSubscription->count()} users without active subscriptions");

        $bar = $this->output->createProgressBar($usersWithoutSubscription->count());
        $bar->start();

        $created = 0;
        $errors = 0;

        foreach ($usersWithoutSubscription as $user) {
            try {
                if (!$dryRun) {
                    $subscriptionTracking->recordPlanChange(
                        user: $user,
                        newPlan: 'free',
                        previousPlan: null,
                        stripePriceId: null,
                        price: 0,
                        billingCycle: 'monthly',
                        reason: 'system_initialization',
                        metadata: ['source' => 'initialize_missing_command']
                    );
                }
                $created++;
                $this->newLine();
                $this->line("✓ Created free subscription for user: {$user->email}");
            } catch (\Exception $e) {
                $errors++;
                $this->newLine();
                $this->error("✗ Failed to create subscription for user {$user->email}: {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        if ($dryRun) {
            $this->info("DRY RUN: Would have created {$created} subscriptions");
        } else {
            $this->info("Successfully created {$created} subscriptions");
        }

        if ($errors > 0) {
            $this->warn("Failed to create {$errors} subscriptions");
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
