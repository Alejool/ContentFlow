<?php

namespace App\Console\Commands;

use App\Models\Social\SocialAccount;
use App\Services\SocialPlatforms\PlatformCapabilitiesService;
use Illuminate\Console\Command;

class UpdateSocialAccountCapabilities extends Command
{
    protected $signature = 'social:update-capabilities 
                            {--account= : Specific account ID to update}
                            {--platform= : Update all accounts for a specific platform}
                            {--force : Force refresh even if recently updated}';

    protected $description = 'Update capabilities metadata for social accounts (video limits, verification status, etc.)';

    public function handle(PlatformCapabilitiesService $capabilitiesService): int
    {
        $accountId = $this->option('account');
        $platform = $this->option('platform');
        $force = $this->option('force');

        $query = SocialAccount::query()->where('is_active', true);

        if ($accountId) {
            $query->where('id', $accountId);
        }

        if ($platform) {
            $query->where('platform', $platform);
        }

        $accounts = $query->get();

        if ($accounts->isEmpty()) {
            $this->error('No accounts found matching the criteria.');
            return self::FAILURE;
        }

        $this->info("Updating capabilities for {$accounts->count()} account(s)...");

        $progressBar = $this->output->createProgressBar($accounts->count());
        $progressBar->start();

        $success = 0;
        $failed = 0;

        foreach ($accounts as $account) {
            try {
                if ($force) {
                    $capabilities = $capabilitiesService->updateAccountCapabilities($account);
                } else {
                    $capabilities = $capabilitiesService->getAccountCapabilities($account);
                }

                $this->newLine();
                $this->info("✓ {$account->platform} - {$account->account_name}");
                
                // Show key capabilities
                if (isset($capabilities['video_duration_limit'])) {
                    $minutes = floor($capabilities['video_duration_limit'] / 60);
                    $this->line("  Video limit: {$minutes} minutes");
                }
                
                if (isset($capabilities['long_uploads_allowed'])) {
                    $status = $capabilities['long_uploads_allowed'] ? 'Yes' : 'No';
                    $this->line("  Long uploads: {$status}");
                }

                if (isset($capabilities['is_premium'])) {
                    $status = $capabilities['is_premium'] ? 'Yes' : 'No';
                    $this->line("  Premium: {$status}");
                }

                $success++;
            } catch (\Exception $e) {
                $this->newLine();
                $this->error("✗ {$account->platform} - {$account->account_name}: {$e->getMessage()}");
                $failed++;
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info("Completed: {$success} successful, {$failed} failed");

        return self::SUCCESS;
    }
}
