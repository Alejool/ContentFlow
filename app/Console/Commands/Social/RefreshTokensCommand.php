<?php

namespace App\Console\Commands\Social;

use Illuminate\Console\Command;
use App\Models\Social\SocialAccount;
use App\Services\SocialTokenManager;
use App\Helpers\LogHelper;

class RefreshTokensCommand extends Command
{
    protected $signature = 'social:refresh-tokens 
                          {--platform= : Specific platform to refresh (twitter, facebook, etc.)}
                          {--force : Force refresh even if token is not expired}
                          {--reset-failed : Reset failed accounts to active}';

    protected $description = 'Refresh social media tokens and reactivate failed accounts';

    public function handle()
    {
        $platform = $this->option('platform');
        $force = $this->option('force');
        $resetFailed = $this->option('reset-failed');

        $this->info('Starting social token refresh process...');

        $query = SocialAccount::query();
        
        if ($platform) {
            $query->where('platform', $platform);
        }

        if ($resetFailed) {
            $this->info('Resetting failed accounts...');
            $failedAccounts = $query->where('is_active', false)->get();
            
            foreach ($failedAccounts as $account) {
                $account->update([
                    'is_active' => true,
                    'failure_count' => 0,
                    'last_failed_at' => null,
                    'account_metadata' => array_merge($account->account_metadata ?? [], [
                        'reset_at' => now()->toIso8601String(),
                        'reset_by' => 'command'
                    ])
                ]);
                
                $this->info("Reset account: {$account->platform} (ID: {$account->id})");
            }
            
            $this->info("Reset {$failedAccounts->count()} failed accounts");
        }

        // Get accounts that need token refresh
        $accounts = $query->where(function($q) use ($force) {
            if ($force) {
                $q->whereNotNull('refresh_token');
            } else {
                $q->where(function($subQ) {
                    $subQ->where('token_expires_at', '<', now()->addHours(1))
                         ->orWhere('is_active', false);
                })->whereNotNull('refresh_token');
            }
        })->get();

        $this->info("Found {$accounts->count()} accounts to refresh");

        $tokenManager = app(SocialTokenManager::class);
        $successCount = 0;
        $failureCount = 0;

        foreach ($accounts as $account) {
            $this->info("Refreshing {$account->platform} account (ID: {$account->id})...");
            
            try {
                $newToken = $tokenManager->refreshToken($account);
                
                if ($newToken) {
                    $successCount++;
                    $this->info("✓ Successfully refreshed {$account->platform} token");
                    
                    // Reactivate account if it was inactive
                    if (!$account->is_active) {
                        $account->update(['is_active' => true]);
                        $this->info("✓ Reactivated {$account->platform} account");
                    }
                } else {
                    $failureCount++;
                    $this->error("✗ Failed to refresh {$account->platform} token");
                }
            } catch (\Exception $e) {
                $failureCount++;
                $this->error("✗ Error refreshing {$account->platform}: {$e->getMessage()}");
                
                LogHelper::social('error', "Command token refresh failed", [
                    'account_id' => $account->id,
                    'platform' => $account->platform,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->info("\nRefresh Summary:");
        $this->info("✓ Successful: {$successCount}");
        $this->info("✗ Failed: {$failureCount}");
        
        if ($failureCount > 0) {
            $this->warn("Some accounts failed to refresh. Check logs for details.");
            $this->info("You may need to manually reconnect these accounts in the UI.");
        }

        return $successCount > 0 ? 0 : 1;
    }
}