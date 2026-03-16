<?php

namespace App\Console\Commands;

use App\Models\Social\SocialAccount;
use Illuminate\Console\Command;

class UpdateTwitterAccountsMetadata extends Command
{
    protected $signature = 'twitter:update-metadata';
    protected $description = 'Update Twitter accounts metadata with default values for verification status';

    public function handle()
    {
        $this->info('Updating Twitter accounts metadata...');
        
        $accounts = SocialAccount::where('platform', 'twitter')->get();
        
        $updated = 0;
        foreach ($accounts as $account) {
            $metadata = $account->account_metadata ?? [];
            $needsUpdate = false;
            
            // Add default values if missing
            if (!isset($metadata['has_twitter_blue'])) {
                $metadata['has_twitter_blue'] = false;
                $needsUpdate = true;
            }
            
            if (!isset($metadata['is_verified'])) {
                $metadata['is_verified'] = false;
                $needsUpdate = true;
            }
            
            if (!isset($metadata['verified_type'])) {
                $metadata['verified_type'] = null;
                $needsUpdate = true;
            }
            
            if ($needsUpdate) {
                $account->update(['account_metadata' => $metadata]);
                $updated++;
                $this->line("  ✓ Updated account: {$account->account_name} (ID: {$account->id})");
            }
        }
        
        $this->info("✓ Updated {$updated} Twitter accounts with default metadata.");
        $this->warn("⚠ Note: These accounts have default values (not verified, no Twitter Blue).");
        $this->warn("   Users should reconnect their accounts to get accurate verification status.");
        
        return 0;
    }
}
