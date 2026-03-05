<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\SubscriptionTrackingService;
use Illuminate\Console\Command;

class TestPlanChange extends Command
{
    protected $signature = 'subscription:test-change {user_id} {plan}';
    protected $description = 'Test plan change for a user';

    public function __construct(
        protected SubscriptionTrackingService $trackingService
    ) {
        parent::__construct();
    }

    public function handle()
    {
        $userId = $this->argument('user_id');
        $newPlan = $this->argument('plan');

        $user = User::find($userId);
        if (!$user) {
            $this->error("User with ID {$userId} not found");
            return 1;
        }

        $this->info("Changing plan for user: {$user->name} (ID: {$user->id})");
        
        $currentHistory = $user->subscriptionHistory()->active()->first();
        $previousPlan = $currentHistory?->plan_name;
        
        $this->line("Current plan: {$previousPlan}");
        $this->line("New plan: {$newPlan}");

        try {
            $planConfig = config("plans.{$newPlan}");
            
            if (!$planConfig) {
                $this->error("Plan configuration not found for: {$newPlan}");
                return 1;
            }

            $history = $this->trackingService->recordPlanChange(
                user: $user,
                newPlan: $newPlan,
                previousPlan: $previousPlan,
                stripePriceId: $planConfig['stripe_price_id'] ?? null,
                price: $planConfig['price'] ?? 0,
                billingCycle: 'monthly',
                reason: 'test_command'
            );

            $this->info("✓ Plan changed successfully!");
            $this->line("New subscription history ID: {$history->id}");
            
            // Show new usage
            $usage = $this->trackingService->getCurrentMonthUsage($user);
            if ($usage) {
                $this->line("\nNew usage limits:");
                $this->line("  Publications: {$usage->publications_used}/{$usage->publications_limit}");
                $this->line("  Storage: " . round($usage->storage_used_bytes / (1024*1024*1024), 2) . " GB / " . round($usage->storage_limit_bytes / (1024*1024*1024), 2) . " GB");
                $this->line("  Social Accounts: {$usage->social_accounts_used}/{$usage->social_accounts_limit}");
                $this->line("  AI Requests: {$usage->ai_requests_used}/" . ($usage->ai_requests_limit ?? '∞'));
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("Failed to change plan: " . $e->getMessage());
            return 1;
        }
    }
}
