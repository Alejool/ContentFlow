<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Social\SocialAccount;

class TestTwitterOAuth extends Command
{
    protected $signature = 'twitter:test-oauth {account_id}';
    protected $description = 'Test Twitter OAuth credentials retrieval';

    public function handle()
    {
        $accountId = $this->argument('account_id');
        $account = SocialAccount::find($accountId);

        if (!$account) {
            $this->error("Account {$accountId} not found");
            return 1;
        }

        $this->info("Testing account: {$account->account_name}");
        $this->newLine();

        // Test direct access
        $this->line("Direct access to account_metadata:");
        dump($account->account_metadata);
        $this->newLine();

        // Test toArray()
        $this->line("Via toArray():");
        $accountArray = $account->toArray();
        dump($accountArray['account_metadata'] ?? 'NOT FOUND');
        $this->newLine();

        // Test OAuth credentials
        $metadata = $account->account_metadata ?? [];
        $oauth1Token = $metadata['oauth1_token'] ?? null;
        $secret = $metadata['secret'] ?? null;

        $this->table(
            ['Key', 'Value', 'Status'],
            [
                ['oauth1_token', $oauth1Token ? substr($oauth1Token, 0, 20) . '...' : 'NULL', $oauth1Token ? '✓' : '✗'],
                ['secret', $secret ? substr($secret, 0, 20) . '...' : 'NULL', $secret ? '✓' : '✗'],
            ]
        );

        if ($oauth1Token && $secret) {
            $this->info('✓ OAuth 1.0a credentials are present');
        } else {
            $this->error('✗ OAuth 1.0a credentials are missing');
        }

        return 0;
    }
}
