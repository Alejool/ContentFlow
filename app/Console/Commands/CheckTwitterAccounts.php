<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Social\SocialAccount;

class CheckTwitterAccounts extends Command
{
    protected $signature = 'twitter:check-accounts';
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

        $this->table(
            ['ID', 'Account Name', 'Username', 'Has OAuth 1.0a', 'Status'],
            $twitterAccounts->map(function ($account) {
                $metadata = $account->account_metadata ?? [];
                $hasOAuth1 = isset($metadata['oauth1_token']) && isset($metadata['secret']);
                
                return [
                    $account->id,
                    $account->account_name,
                    $metadata['username'] ?? 'N/A',
                    $hasOAuth1 ? '✓ Yes' : '✗ No',
                    $hasOAuth1 ? 'Can upload videos' : 'Cannot upload videos - needs reconnection'
                ];
            })->toArray()
        );

        $missingOAuth1 = $twitterAccounts->filter(function ($account) {
            $metadata = $account->account_metadata ?? [];
            return !isset($metadata['oauth1_token']) || !isset($metadata['secret']);
        });

        if ($missingOAuth1->isNotEmpty()) {
            $this->newLine();
            $this->warn('⚠ ' . $missingOAuth1->count() . ' account(s) missing OAuth 1.0a credentials.');
            $this->info('These accounts cannot upload videos to Twitter.');
            $this->info('Users need to disconnect and reconnect these accounts to enable video uploads.');
        } else {
            $this->newLine();
            $this->info('✓ All Twitter accounts have OAuth 1.0a credentials.');
        }

        return 0;
    }
}
