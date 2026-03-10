<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Social\SocialAccount;
use App\Services\SocialPlatforms\TwitterService;

class CheckTwitterAccount extends Command
{
    protected $signature = 'twitter:check {account_id?}';
    protected $description = 'Check Twitter account credentials and test API access';

    public function handle()
    {
        $accountId = $this->argument('account_id');

        if (!$accountId) {
            // Mostrar todas las cuentas de Twitter
            $accounts = SocialAccount::whereIn('platform', ['twitter', 'x'])->get();
            
            if ($accounts->isEmpty()) {
                $this->error('No Twitter accounts found in database');
                return 1;
            }

            $this->info('Twitter Accounts:');
            $this->table(
                ['ID', 'Platform', 'Username', 'Status', 'Created'],
                $accounts->map(fn($acc) => [
                    $acc->id,
                    $acc->platform,
                    $acc->platform_username ?? 'N/A',
                    $acc->status,
                    $acc->created_at->format('Y-m-d H:i')
                ])
            );

            $accountId = $this->ask('Enter account ID to check');
            $accountId = (int) trim($accountId);
        }

        $accountId = (int) $accountId;
        $account = SocialAccount::find($accountId);

        if (!$account) {
            $this->error("Account #{$accountId} not found");
            return 1;
        }

        if (!in_array($account->platform, ['twitter', 'x'])) {
            $this->error("Account #{$accountId} is not a Twitter account");
            return 1;
        }

        $this->info("Checking Twitter Account #{$account->id}");
        $this->newLine();

        // Verificar tokens v2.0
        $this->info('=== OAuth 2.0 (v2.0) Tokens ===');
        $hasV2Token = !empty($account->access_token);
        $hasRefreshToken = !empty($account->refresh_token);
        
        $this->line("Access Token: " . ($hasV2Token ? '✓ Present' : '❌ Missing'));
        $this->line("Refresh Token: " . ($hasRefreshToken ? '✓ Present' : '❌ Missing'));
        
        if ($account->token_expires_at) {
            $expired = $account->token_expires_at->isPast();
            $this->line("Expires: " . $account->token_expires_at->format('Y-m-d H:i:s') . ($expired ? ' ❌ EXPIRED' : ' ✓ Valid'));
        }

        $this->newLine();

        // Verificar tokens v1.1
        $this->info('=== OAuth 1.0a (v1.1) Tokens ===');
        $metadata = $account->account_metadata ?? [];
        $hasV1Token = !empty($metadata['token'] ?? null);
        $hasV1Secret = !empty($metadata['secret'] ?? null);
        
        $this->line("OAuth Token: " . ($hasV1Token ? '✓ Present' : '❌ Missing'));
        $this->line("OAuth Secret: " . ($hasV1Secret ? '✓ Present' : '❌ Missing'));

        $this->newLine();

        // Test API access
        if ($hasV2Token) {
            $this->info('=== Testing API Access ===');
            
            try {
                $service = new TwitterService($account->access_token, $account);
                
                $this->line('Testing v2.0 API...');
                $accountInfo = $service->getAccountInfo();
                
                $this->info('✓ Successfully connected to Twitter API v2.0');
                $this->line("Username: @{$accountInfo['username']}");
                $this->line("Name: {$accountInfo['name']}");
                $this->line("ID: {$accountInfo['id']}");
                
            } catch (\Throwable $e) {
                $this->error('❌ API test failed: ' . $e->getMessage());
                
                if (str_contains($e->getMessage(), '401')) {
                    $this->warn('Token may be expired or invalid. Try reconnecting the account.');
                }
            }
        } else {
            $this->warn('Cannot test API - no access token available');
        }

        $this->newLine();
        $this->info('=== Recommendations ===');
        
        if (!$hasV2Token) {
            $this->line('• Reconnect account to get OAuth 2.0 tokens');
        }
        
        if (!$hasV1Token || !$hasV1Secret) {
            $this->line('• Reconnect account to get OAuth 1.0a tokens (needed for media upload)');
        }
        
        if ($hasV2Token && $account->token_expires_at && $account->token_expires_at->isPast()) {
            $this->line('• Token expired - account will auto-refresh on next use');
        }

        return 0;
    }
}
