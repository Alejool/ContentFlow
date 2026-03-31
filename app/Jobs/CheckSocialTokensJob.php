<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Social\SocialAccount;
use App\Models\User;
use App\Notifications\SocialTokenExpiryNotification;
use App\Services\SocialTokenManager;
use App\Helpers\LogHelper;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class CheckSocialTokensJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 1; // Don't retry, run again on schedule

    public function handle()
    {
        LogHelper::social('token_check.started', [
            'message' => 'Starting scheduled token check'
        ]);

        $tokenManager = app(SocialTokenManager::class);
        
        // Get accounts that expire in the next 2 hours or are inactive
        $accounts = SocialAccount::where(function($query) {
            $query->where('token_expires_at', '<', now()->addHours(2))
                  ->orWhere('is_active', false);
        })
        ->whereNotNull('refresh_token')
        ->get();

        LogHelper::social('token_check.accounts_found', [
            'count' => $accounts->count()
        ]);

        $refreshed = 0;
        $failed = 0;

        foreach ($accounts as $account) {
            try {
                LogHelper::social('token_check.checking_account', [
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
                        LogHelper::social('token_check.account_reactivated', [
                            'account_id' => $account->id,
                            'platform' => $account->platform
                        ]);
                    }
                    
                    LogHelper::social('token_check.refresh_successful', [
                        'account_id' => $account->id,
                        'platform' => $account->platform
                    ]);
                } else {
                    $failed++;
                    LogHelper::social('token_check.refresh_failed', [
                        'account_id' => $account->id,
                        'platform' => $account->platform
                    ]);
                }
            } catch (\Exception $e) {
                $failed++;
                LogHelper::socialError('token_check.exception', $e->getMessage(), [
                    'account_id' => $account->id,
                    'platform' => $account->platform
                ]);
            }
        }

        LogHelper::social('token_check.completed', [
            'total_checked' => $accounts->count(),
            'refreshed' => $refreshed,
            'failed' => $failed
        ]);

        // If there are still failed accounts, log a summary
        if ($failed > 0) {
            $failedAccounts = SocialAccount::where('is_active', false)
                ->whereNotNull('refresh_token')
                ->get(['id', 'platform', 'failure_count', 'last_failed_at']);

            LogHelper::social('token_check.failed_accounts_summary', [
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

        // Proactively notify workspace owners about tokens expiring soon
        $this->sendExpiryNotifications();
    }

    /**
     * Find accounts expiring within 7 days and send notification to workspace owners.
     * Uses a cache key to avoid sending the same notification more than once per day.
     */
    private function sendExpiryNotifications(): void
    {
        $thresholds = [1, 3, 7]; // Days before expiry to notify

        foreach ($thresholds as $days) {
            $windowStart = now()->addDays($days - 1);
            $windowEnd   = now()->addDays($days);

            $accounts = SocialAccount::where('is_active', true)
                ->whereNotNull('token_expires_at')
                ->whereBetween('token_expires_at', [$windowStart, $windowEnd])
                ->with('user:id,name,email')
                ->get();

            foreach ($accounts as $account) {
                // De-duplicate: only notify once per day per account per threshold
                $cacheKey = "token_expiry_notif_{$account->id}_{$days}d";
                if (Cache::has($cacheKey)) {
                    continue;
                }

                // Notify the account owner
                $owner = $account->user;
                if ($owner) {
                    $daysLeft = (int) ceil($account->token_expires_at->diffInHours(now()) / 24);
                    $owner->notify(new SocialTokenExpiryNotification($account, $daysLeft));

                    LogHelper::social('token_check.expiry_notification_sent', [
                        'account_id'  => $account->id,
                        'platform'    => $account->platform,
                        'days_left'   => $daysLeft,
                        'user_id'     => $owner->id,
                    ]);
                }

                // Cache for 23 hours to avoid duplicate notifications
                Cache::put($cacheKey, true, now()->addHours(23));
            }
        }
    }
}