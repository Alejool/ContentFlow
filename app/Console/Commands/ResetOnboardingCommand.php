<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ResetOnboardingCommand extends Command
{
    protected $signature = 'onboarding:reset {user_id?}';
    protected $description = 'Reset onboarding state for a user';

    public function handle()
    {
        $userId = $this->argument('user_id');
        
        if ($userId) {
            $user = User::find($userId);
            if (!$user) {
                $this->error("User with ID {$userId} not found");
                return 1;
            }
            $users = collect([$user]);
        } else {
            $users = User::all();
        }
        
        foreach ($users as $user) {
            $state = $user->onboardingState;
            if ($state) {
                $state->update([
                    'tour_current_step' => 0,
                    'tour_completed' => false,
                    'tour_skipped' => false,
                    'tour_completed_steps' => [],
                    'wizard_current_step' => 0,
                    'wizard_completed' => false,
                    'wizard_skipped' => false,
                ]);
                $this->info("Onboarding reset for user {$user->id} ({$user->email})");
            } else {
                $this->warn("No onboarding state found for user {$user->id}");
            }
        }
        
        $this->info('Done!');
        return 0;
    }
}
