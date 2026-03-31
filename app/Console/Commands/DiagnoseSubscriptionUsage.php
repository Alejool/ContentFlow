<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\SubscriptionTrackingService;
use Illuminate\Console\Command;

class DiagnoseSubscriptionUsage extends Command
{
    protected $signature = 'subscription:diagnose-usage {user_id?}';
    protected $description = 'Diagnose subscription usage data for users';

    public function __construct(
        protected SubscriptionTrackingService $trackingService
    ) {
        parent::__construct();
    }

    public function handle()
    {
        $userId = $this->argument('user_id');

        if ($userId) {
            $user = User::find($userId);
            if (!$user) {
                $this->error("User with ID {$userId} not found");
                return 1;
            }
            $this->diagnoseUser($user);
        } else {
            $users = User::all();
            $this->info("Diagnosing all users ({$users->count()})...\n");
            
            foreach ($users as $user) {
                $this->diagnoseUser($user);
                $this->line('---');
            }
        }

        return 0;
    }

    protected function diagnoseUser(User $user)
    {
        $this->info("User: {$user->name} (ID: {$user->id})");
        $this->line("Email: {$user->email}");

        // Check active subscription
        $activeHistory = $user->subscriptionHistory()->active()->first();
        
        if (!$activeHistory) {
            $this->warn("  ❌ No active subscription found");
            return;
        }

        $this->info("  ✓ Active subscription: {$activeHistory->plan_name}");
        $this->line("    Started: {$activeHistory->started_at}");

        // Check current usage
        $usage = $this->trackingService->getCurrentMonthUsage($user);
        
        if (!$usage) {
            $this->error("  ❌ Failed to get/create usage tracking");
            return;
        }

        $this->info("  ✓ Usage tracking found/created");
        $this->line("    Period: {$usage->year}-{$usage->month}");
        $this->line("    Publications: {$usage->publications_used}/{$usage->publications_limit}");
        $this->line("    Storage: " . round($usage->storage_used_bytes / (1024*1024*1024), 2) . " GB / " . round($usage->storage_limit_bytes / (1024*1024*1024), 2) . " GB");
        $this->line("    Social Accounts: {$usage->social_accounts_used}/{$usage->social_accounts_limit}");
        $this->line("    AI Requests: {$usage->ai_requests_used}/" . ($usage->ai_requests_limit ?? '∞'));
    }
}
