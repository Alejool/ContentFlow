<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\OnboardingService;
use Illuminate\Support\Facades\Log;

class InitializeMissingOnboarding extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'onboarding:initialize-missing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Initialize onboarding for users who do not have it';

    protected OnboardingService $onboardingService;

    public function __construct(OnboardingService $onboardingService)
    {
        parent::__construct();
        $this->onboardingService = $onboardingService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for users without onboarding...');

        $users = User::whereDoesntHave('onboardingState')->get();

        if ($users->isEmpty()) {
            $this->info('All users have onboarding initialized.');
            return 0;
        }

        $this->info("Found {$users->count()} users without onboarding.");

        $bar = $this->output->createProgressBar($users->count());
        $bar->start();

        $initialized = 0;
        foreach ($users as $user) {
            try {
                $this->onboardingService->initializeOnboarding($user);
                $initialized++;
                Log::info("Onboarding initialized for user {$user->id}");
            } catch (\Exception $e) {
                Log::error("Failed to initialize onboarding for user {$user->id}: {$e->getMessage()}");
                $this->error("\nFailed for user {$user->id}: {$e->getMessage()}");
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Successfully initialized onboarding for {$initialized} users.");

        return 0;
    }
}
