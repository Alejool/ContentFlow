<?php

namespace App\Console\Commands;

use App\Models\Social\SocialAccount;
use Illuminate\Console\Command;

class UpdateYouTubeAccountsMetadata extends Command
{
    protected $signature = 'youtube:update-metadata';
    protected $description = 'Update YouTube accounts metadata with default values for verification status';

    public function handle()
    {
        $this->info('Updating YouTube accounts metadata...');
        
        $accounts = SocialAccount::where('platform', 'youtube')->get();
        
        $updated = 0;
        foreach ($accounts as $account) {
            $metadata = $account->account_metadata ?? [];
            $needsUpdate = false;
            
            // Add default values if missing (assume unverified = 15 min limit)
            if (!isset($metadata['is_verified'])) {
                $metadata['is_verified'] = false;
                $needsUpdate = true;
            }
            
            if (!isset($metadata['long_uploads_enabled'])) {
                $metadata['long_uploads_enabled'] = false;
                $needsUpdate = true;
            }
            
            if ($needsUpdate) {
                $account->update(['account_metadata' => $metadata]);
                $updated++;
                $this->line("  ✓ Updated account: {$account->account_name} (ID: {$account->id})");
            }
        }
        
        $this->info("✓ Updated {$updated} YouTube accounts with default metadata.");
        $this->warn("⚠ Note: These accounts have default values (unverified = 15 min limit).");
        $this->warn("   Users should reconnect their accounts to get accurate verification status.");
        
        return 0;
    }
}
