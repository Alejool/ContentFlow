<?php

namespace App\Jobs;

use App\Models\Social\SocialAccount;
use App\Services\SocialTokenManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RefreshSocialTokensJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $account;

    public function __construct(SocialAccount $account)
    {
        $this->account = $account;
    }

    public function handle(SocialTokenManager $tokenManager): void
    {
        try {
            Log::info("Refreshing token for account {$this->account->id} ({$this->account->platform})");

            $tokenManager->getValidToken($this->account);

            Log::info("Successfully refreshed token for account {$this->account->id}");
        } catch (\Exception $e) {
            Log::error("Failed to refresh token for account {$this->account->id}: " . $e->getMessage());

            // If refresh fails multiple times, notify user
            if ($this->account->failure_count >= 3) {
                // TODO: Send notification to user to reconnect account
                Log::warning("Account {$this->account->id} requires manual reconnection");
            }
        }
    }
}
