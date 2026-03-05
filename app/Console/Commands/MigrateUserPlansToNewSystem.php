<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\PlanManagementService;
use Illuminate\Support\Facades\DB;

class MigrateUserPlansToNewSystem extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscription:migrate-to-new-system {--force : Force migration even if user already has current_plan set}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate existing subscription data to new user.current_plan system';

    /**
     * Execute the console command.
     */
    public function handle(PlanManagementService $planManagement): int
    {
        $this->info('Starting migration to new subscription system...');
        $this->newLine();
        
        $force = $this->option('force');
        
        // Get all users
        $users = User::all();
        
        if ($users->isEmpty()) {
            $this->warn('No users found.');
            return Command::SUCCESS;
        }
        
        $this->info("Found {$users->count()} users to process.");
        $this->newLine();
        
        $bar = $this->output->createProgressBar($users->count());
        $bar->start();
        
        $migrated = 0;
        $skipped = 0;
        $failed = 0;
        
        foreach ($users as $user) {
            try {
                // Skip if user already has current_plan set (unless force)
                if ($user->current_plan && $user->current_plan !== 'free' && !$force) {
                    $skipped++;
                    $bar->advance();
                    continue;
                }
                
                // Try to get plan from subscription_history first
                $activeHistory = $user->subscriptionHistory()->active()->first();
                $plan = null;
                
                if ($activeHistory) {
                    $plan = $activeHistory->plan_name;
                    $this->newLine();
                    $this->info("User {$user->id}: Found active history with plan '{$plan}'");
                } else {
                    // Fallback to workspace subscription
                    $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
                    if ($workspace && $workspace->subscription) {
                        $plan = $workspace->subscription->plan;
                        $this->newLine();
                        $this->info("User {$user->id}: Found workspace subscription with plan '{$plan}'");
                    }
                }
                
                // Default to free if no plan found
                if (!$plan) {
                    $plan = 'free';
                    $this->newLine();
                    $this->comment("User {$user->id}: No plan found, defaulting to 'free'");
                }
                
                // Use the centralized service to set the plan
                $success = $planManagement->changePlan(
                    user: $user,
                    newPlan: $plan,
                    reason: 'system_migration',
                    metadata: [
                        'migrated_at' => now()->toDateTimeString(),
                        'migration_source' => $activeHistory ? 'subscription_history' : 'workspace_subscription',
                    ]
                );
                
                if ($success) {
                    $migrated++;
                } else {
                    $failed++;
                    $this->newLine();
                    $this->error("Failed to migrate user {$user->id}");
                }
                
            } catch (\Exception $e) {
                $failed++;
                $this->newLine();
                $this->error("Error migrating user {$user->id}: {$e->getMessage()}");
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        
        $this->info('Migration complete!');
        $this->table(
            ['Status', 'Count'],
            [
                ['Migrated', $migrated],
                ['Skipped', $skipped],
                ['Failed', $failed],
                ['Total', $users->count()],
            ]
        );
        
        return Command::SUCCESS;
    }
}
