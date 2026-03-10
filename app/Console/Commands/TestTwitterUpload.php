<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Social\SocialAccount;
use App\Services\SocialPlatforms\TwitterService;

class TestTwitterUpload extends Command
{
    protected $signature = 'twitter:test-upload {account_id}';
    protected $description = 'Test Twitter video upload capability';

    public function handle()
    {
        $accountId = $this->argument('account_id');
        $account = SocialAccount::find($accountId);

        if (!$account) {
            $this->error("Account {$accountId} not found");
            return 1;
        }

        $this->info("Testing Twitter upload for: {$account->account_name}");
        $this->newLine();

        try {
            // Create service instance
            $service = new TwitterService($account->access_token, $account);
            
            // Test credential validation
            $this->line("Validating credentials...");
            $isValid = $service->validateCredentials();
            
            if ($isValid) {
                $this->info("✓ Credentials are valid");
            } else {
                $this->error("✗ Credentials validation failed");
                return 1;
            }

            // Check OAuth 1.0a credentials
            $metadata = $account->account_metadata ?? [];
            $hasOAuth1 = isset($metadata['oauth1_token']) && isset($metadata['secret']);
            
            $this->newLine();
            $this->line("OAuth 1.0a Status:");
            if ($hasOAuth1) {
                $this->info("✓ OAuth 1.0a credentials present");
                $this->line("  Token: " . substr($metadata['oauth1_token'], 0, 20) . "...");
                $this->line("  Secret: " . substr($metadata['secret'], 0, 20) . "...");
            } else {
                $this->error("✗ OAuth 1.0a credentials missing");
                $this->warn("Video uploads will fail. Account needs to be reconnected.");
            }

            $this->newLine();
            $this->info("Test completed successfully");
            
        } catch (\Exception $e) {
            $this->error("Test failed: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
