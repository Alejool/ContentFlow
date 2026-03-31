<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class DiagnoseSubscription extends Command
{
    protected $signature = 'diagnose:subscription {user_id}';
    protected $description = 'Diagnose subscription status for a user';

    public function handle()
    {
        $userId = $this->argument('user_id');
        $user = User::find($userId);

        if (!$user) {
            $this->error("User not found");
            return 1;
        }

        $this->info("User: {$user->name} (ID: {$user->id})");
        $this->info("Current Plan: {$user->current_plan}");
        
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
        
        if (!$workspace) {
            $this->error("No workspace found");
            return 1;
        }

        $this->info("Workspace: {$workspace->name} (ID: {$workspace->id})");
        $this->newLine();

        // Check all subscriptions
        $this->info("=== All Subscriptions ===");
        $allSubscriptions = $workspace->subscriptions()->get();
        
        if ($allSubscriptions->isEmpty()) {
            $this->warn("No subscriptions found");
        } else {
            foreach ($allSubscriptions as $sub) {
                $this->line("ID: {$sub->id}");
                $this->line("Type: {$sub->type}");
                $this->line("Stripe ID: {$sub->stripe_id}");
                $this->line("Stripe Status: {$sub->stripe_status}");
                $this->line("Stripe Price: {$sub->stripe_price}");
                $this->line("Quantity: {$sub->quantity}");
                $this->line("Trial Ends At: {$sub->trial_ends_at}");
                $this->line("Ends At: {$sub->ends_at}");
                $this->line("Created At: {$sub->created_at}");
                $this->newLine();
            }
        }

        // Check active subscriptions
        $this->info("=== Active Subscriptions (type=default, status=active) ===");
        $activeSubscriptions = $workspace->subscriptions()
            ->where('type', 'default')
            ->where('stripe_status', 'active')
            ->get();
            
        if ($activeSubscriptions->isEmpty()) {
            $this->warn("No active subscriptions found with type=default and status=active");
        } else {
            foreach ($activeSubscriptions as $sub) {
                $this->line("ID: {$sub->id}");
                $this->line("Stripe ID: {$sub->stripe_id}");
                $this->line("Starts with 'sub_': " . (str_starts_with($sub->stripe_id, 'sub_') ? 'YES' : 'NO'));
                $this->newLine();
            }
        }

        // Check subscription history
        $this->info("=== Subscription History ===");
        $history = $user->subscriptionHistory()->orderBy('created_at', 'desc')->limit(5)->get();
        
        if ($history->isEmpty()) {
            $this->warn("No subscription history found");
        } else {
            foreach ($history as $h) {
                $this->line("Plan: {$h->plan_name}");
                $this->line("Status: {$h->status}");
                $this->line("Started At: {$h->started_at}");
                $this->line("Ended At: {$h->ended_at}");
                $this->newLine();
            }
        }

        return 0;
    }
}
