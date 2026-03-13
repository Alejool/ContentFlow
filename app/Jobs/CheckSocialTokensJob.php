<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Social\SocialAccount;
use App\Services\SocialTokenManager;
use App\Helpers\LogHelper;
use Carbon\Carbon;

class CheckSocialTokensJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 1; // Don't retry, run again on schedule

    public function handle()
    {
        LogHelper::social('info', 'Starting scheduled token check');

        $tokenManager = app(SocialTokenManager::class);
        
        // Get accounts that expire in the next 2 hours or are inactive
        $accounts = SocialAccount::where(function($query) {
            $query->where('token_expires_at', '<', now()->addHours(2))
                  ->orWhere('is_active', false);
        })
        ->whereNotNull('refresh_token')
        ->get();

        LogHelper::social('info', 'Found accounts needing token refresh', [
            'count' => $accounts->count()
        ]);

        $refreshed = 0;
        $failed = 0;

        foreach ($accounts as $account) {
            try {
                LogHelper::social('info', 'Checking token for account', [
                    'account_id' => $account->id,
                    'platform' => $account->platform,
                    'expires_at' => $account->token_expires_at?->toIso8601String(),
                    'is_active' => $account->is_active
                ]);

                $newToken = $tokenManager->refreshToken($account);
                
                if ($newToken) {
                    $refreshed++;
                    
                    // Reactivate account if it was inactive
                    if (!$account->is_active) {
                        $account->update(['is_active' => true]);
                        LogHelper::social('info', 'Reactivated account after token refresh', [
                            'account_id' => $account->id,
                            'platform' => $account->platform
                        ]);
                    }
                    
                    LogHelper::social('info', 'Token refreshed successfully', [
                        'account_id' => $account->id,
                        'platform' => $account->platform
                    ]);
                } else {
                    $failed++;
                    LogHelper::social('warning', 'Token refresh failed', [
                        'account_id' => $account->id,
                        'platform' => $account->platform
                    ]);
                }
            } catch (\Exception $e) {
                $failed++;
                LogHelper::social('error', 'Token refresh exception', [
                    'account_id' => $account->id,
                    'platform' => $account->platform,
                    'error' => $e->getMessage()
                ]);
            }
        }

        LogHelper::social('info', 'Token check completed', [
            'total_checked' => $accounts->count(),
            'refreshed' => $refreshed,
            'failed' => $failed
        ]);

        // If there are still failed accounts, log a summary
        if ($failed > 0) {
            $failedAccounts = SocialAccount::where('is_active', false)
                ->whereNotNull('refresh_token')
                ->get(['id', 'platform', 'failure_count', 'last_failed_at']);

            LogHelper::social('warning', 'Some accounts still need manual reconnection', [
                'failed_accounts' => $failedAccounts->map(function($account) {
                    return [
                        'id' => $account->id,
                        'platform' => $account->platform,
                        'failure_count' => $account->failure_count,
                        'last_failed_at' => $account->last_failed_at?->toIso8601String()
                    ];
                })->toArray()
            ]);
        }
    }
}