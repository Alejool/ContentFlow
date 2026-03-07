<?php

namespace App\Console\Commands;

use App\Models\OnboardingState;
use Illuminate\Console\Command;

class FixOnboardingTemplateSelection extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'onboarding:fix-template-selection';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix onboarding states that have completed wizard but not selected template';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing onboarding states...');

        // Find all onboarding states where wizard is completed or skipped but template is not selected
        $states = OnboardingState::where(function ($query) {
            $query->where('wizard_completed', true)
                  ->orWhere('wizard_skipped', true);
        })
        ->where('template_selected', false)
        ->get();

        if ($states->isEmpty()) {
            $this->info('No onboarding states need fixing.');
            return 0;
        }

        $this->info("Found {$states->count()} onboarding state(s) to fix.");

        $bar = $this->output->createProgressBar($states->count());
        $bar->start();

        foreach ($states as $state) {
            $state->update([
                'template_selected' => true,
                'template_id' => 'default',
            ]);

            // Check if onboarding should be marked as complete
            if ($state->business_info_completed && 
                $state->plan_selected && 
                ($state->tour_completed || $state->tour_skipped) && 
                ($state->wizard_completed || $state->wizard_skipped) && 
                $state->template_selected &&
                !$state->completed_at) {
                
                $state->update([
                    'completed_at' => now(),
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Onboarding states fixed successfully!');

        return 0;
    }
}
