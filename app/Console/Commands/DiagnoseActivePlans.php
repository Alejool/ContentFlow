<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class DiagnoseActivePlans extends Command
{
    protected $signature = 'diagnose:active-plans {user_id}';
    protected $description = 'Diagnose active plans for a user';

    public function handle()
    {
        $userId = $this->argument('user_id');
        $user = User::find($userId);

        if (!$user) {
            $this->error("User not found");
            return 1;
        }

        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if (!$workspace) {
            $this->error("No workspace found");
            return 1;
        }

        $this->info("=== WORKSPACE INFO ===");
        $this->info("Workspace ID: {$workspace->id}");
        $this->info("Workspace Plan: {$workspace->getPlanName()}");
        $this->info("");

        $this->info("=== STRIPE SUBSCRIPTIONS ===");
        $subscriptions = $workspace->subscriptions()->get();
        
        if ($subscriptions->isEmpty()) {
            $this->warn("No Stripe subscriptions found");
        } else {
            foreach ($subscriptions as $sub) {
                $this->info("ID: {$sub->id}");
                $this->info("  Stripe ID: {$sub->stripe_id}");
                $this->info("  Plan: {$sub->plan}");
                $this->info("  Status: {$sub->stripe_status}");
                $this->info("  Stripe Price: {$sub->stripe_price}");
                $this->info("  Ends At: " . ($sub->ends_at ?? 'null'));
                $this->info("  Cancel at period end: " . ($sub->cancel_at_period_end ? 'yes' : 'no'));
                $this->info("");
            }
        }

        $this->info("=== ACTIVE SUBSCRIPTIONS (active/trialing/past_due) ===");
        $activeSubscriptions = $workspace->subscriptions()
            ->whereIn('stripe_status', ['active', 'trialing', 'past_due'])
            ->get();
            
        if ($activeSubscriptions->isEmpty()) {
            $this->warn("No active subscriptions found");
        } else {
            foreach ($activeSubscriptions as $sub) {
                $this->info("Plan: {$sub->plan} - Status: {$sub->stripe_status}");
            }
        }

        $this->info("");
        $this->info("=== SUBSCRIPTION HISTORY ===");
        $history = $user->subscriptionHistory()->get();
        
        if ($history->isEmpty()) {
            $this->warn("No subscription history found");
        } else {
            foreach ($history as $h) {
                $this->info("Plan: {$h->plan_name}");
                $this->info("  Active: " . ($h->is_active ? 'yes' : 'no'));
                $this->info("  Started: {$h->started_at}");
                $this->info("  Ended: " . ($h->ended_at ?? 'null'));
                $this->info("");
            }
        }

        return 0;
    }
}
