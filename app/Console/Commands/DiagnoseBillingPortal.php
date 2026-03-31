<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DiagnoseBillingPortal extends Command
{
    protected $signature = 'diagnose:billing-portal {user_id?}';
    protected $description = 'Diagnose billing portal access issues';

    public function handle()
    {
        $userId = $this->argument('user_id') ?? auth()->id() ?? 1;
        
        $user = \App\Models\User::find($userId);
        
        if (!$user) {
            $this->error("User not found with ID: {$userId}");
            return 1;
        }

        $this->info("Diagnosing billing portal for user: {$user->name} (ID: {$user->id})");
        $this->newLine();

        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
        
        if (!$workspace) {
            $this->error('❌ No workspace found');
            return 1;
        }

        $this->info("✓ Workspace found: {$workspace->name} (ID: {$workspace->id})");
        $this->info("  Workspace Stripe ID: " . ($workspace->stripe_id ?? 'NULL'));
        $this->newLine();

        $subscription = $workspace->subscription;
        
        if (!$subscription) {
            $this->error('❌ No subscription found');
            return 1;
        }

        $this->info("✓ Subscription found");
        $this->info("  Plan: {$subscription->plan}");
        $this->info("  Status: {$subscription->status}");
        $this->info("  Stripe Status: {$subscription->stripe_status}");
        $this->info("  Stripe ID: " . ($subscription->stripe_id ?? 'NULL'));
        $this->newLine();

        // Check if it's a valid Stripe subscription
        if (!$subscription->stripe_id) {
            $this->warn('⚠ Subscription has no Stripe ID');
        } elseif (str_starts_with($subscription->stripe_id, 'free_')) {
            $this->warn('⚠ This is a FREE plan (local, not Stripe)');
        } elseif (str_starts_with($subscription->stripe_id, 'demo_')) {
            $this->warn('⚠ This is a DEMO plan (local, not Stripe)');
        } else {
            $this->info('✓ Valid Stripe subscription ID');
        }

        $this->newLine();

        // Check workspace Stripe customer
        if (!$workspace->stripe_id) {
            $this->error('❌ Workspace has no Stripe customer ID');
            $this->warn('   The workspace needs to be a Stripe customer to access the billing portal');
            $this->warn('   This usually happens when creating a subscription through Stripe Checkout');
        } else {
            $this->info('✓ Workspace has Stripe customer ID');
            
            // Try to access billing portal
            try {
                $this->info('Attempting to create billing portal session...');
                $url = $workspace->redirectToBillingPortal(route('subscription.billing'));
                $this->info('✓ Billing portal URL created successfully!');
                $this->info("  URL: {$url->getTargetUrl()}");
            } catch (\Exception $e) {
                $this->error('❌ Error creating billing portal session:');
                $this->error("  {$e->getMessage()}");
            }
        }

        return 0;
    }
}
