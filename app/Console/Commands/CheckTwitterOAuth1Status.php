<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Social\SocialAccount;

class CheckTwitterOAuth1Status extends Command
{
    protected $signature = 'twitter:check-oauth1-status';
    protected $description = 'Check which Twitter accounts are missing OAuth 1.0a credentials';

    public function handle()
    {
        $this->info('Checking Twitter accounts for OAuth 1.0a credentials...');
        $this->newLine();

        $twitterAccounts = SocialAccount::where('platform', 'twitter')
            ->whereNull('deleted_at')
            ->get();

        if ($twitterAccounts->isEmpty()) {
            $this->warn('No Twitter accounts found.');
            return 0;
        }

        $accountsWithOAuth1 = 0;
        $accountsWithoutOAuth1 = 0;
        $accountsNeedingReconnection = [];

        $headers = ['ID', 'Account Name', 'Username', 'Has OAuth 1.0a', 'Status', 'Workspace ID'];
        $rows = [];

        foreach ($twitterAccounts as $account) {
            $metadata = $account->account_metadata ?? [];
            $hasOAuth1Token = isset($metadata['oauth1_token']);
            $hasSecret = isset($metadata['secret']);
            $hasOAuth1 = $hasOAuth1Token && $hasSecret;

            if ($hasOAuth1) {
                $accountsWithOAuth1++;
                $status = '<fg=green>✓ Can upload videos</>';
            } else {
                $accountsWithoutOAuth1++;
                $status = '<fg=red>✗ Cannot upload videos</>';
                $accountsNeedingReconnection[] = [
                    'id' => $account->id,
                    'name' => $account->account_name,
                    'username' => $metadata['username'] ?? 'N/A',
                    'workspace_id' => $account->workspace_id
                ];
            }

            $rows[] = [
                $account->id,
                $account->account_name ?? 'N/A',
                $metadata['username'] ?? 'N/A',
                $hasOAuth1 ? '<fg=green>✓ Yes</>' : '<fg=red>✗ No</>',
                $status,
                $account->workspace_id ?? 'N/A'
            ];
        }

        $this->table($headers, $rows);
        $this->newLine();

        // Summary
        $this->info("Summary:");
        $this->line("  Total Twitter accounts: {$twitterAccounts->count()}");
        $this->line("  <fg=green>With OAuth 1.0a: {$accountsWithOAuth1}</>");
        $this->line("  <fg=red>Without OAuth 1.0a: {$accountsWithoutOAuth1}</>");
        $this->newLine();

        // Recommendations
        if ($accountsWithoutOAuth1 > 0) {
            $this->warn('⚠️  Accounts without OAuth 1.0a credentials cannot upload videos to Twitter.');
            $this->newLine();
            $this->info('To fix this issue:');
            $this->line('1. Go to Workspace Settings → Social Accounts');
            $this->line('2. Disconnect the affected account(s)');
            $this->line('3. Reconnect the account(s) following the complete OAuth flow');
            $this->newLine();

            $this->info('Accounts needing reconnection:');
            foreach ($accountsNeedingReconnection as $acc) {
                $this->line("  - ID {$acc['id']}: {$acc['name']} (@{$acc['username']}) - Workspace {$acc['workspace_id']}");
            }
        } else {
            $this->info('✓ All Twitter accounts have OAuth 1.0a credentials and can upload videos!');
        }

        return 0;
    }
}
