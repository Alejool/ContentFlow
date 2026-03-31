<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\PlanManagementService;

class RenewMonthlySubscriptionLimits extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscription:renew-monthly-limits';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Renew monthly subscription limits for all users (resets usage counters but keeps history)';

    /**
     * Execute the console command.
     */
    public function handle(PlanManagementService $planManagement): int
    {
        $this->info('Starting monthly subscription limits renewal...');
        
        // Get all users who need renewal
        $users = User::whereNotNull('plan_renews_at')
            ->where('plan_renews_at', '<=', now())
            ->get();
        
        if ($users->isEmpty()) {
            $this->info('No users need renewal at this time.');
            return Command::SUCCESS;
        }
        
        $this->info("Found {$users->count()} users to renew.");
        
        $bar = $this->output->createProgressBar($users->count());
        $bar->start();
        
        $renewed = 0;
        $failed = 0;
        
        foreach ($users as $user) {
            try {
                $planManagement->renewMonthlyLimits($user);
                $renewed++;
                $this->newLine();
                $this->info("✓ Renewed limits for user {$user->id} ({$user->email})");
            } catch (\Exception $e) {
                $failed++;
                $this->newLine();
                $this->error("✗ Failed to renew for user {$user->id}: {$e->getMessage()}");
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        
        $this->info("Renewal complete!");
        $this->table(
            ['Status', 'Count'],
            [
                ['Renewed', $renewed],
                ['Failed', $failed],
                ['Total', $users->count()],
            ]
        );
        
        return Command::SUCCESS;
    }
}
