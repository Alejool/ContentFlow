<?php

namespace App\Console\Commands;

use App\Jobs\SyncSocialAnalyticsJob;
use App\Models\Social\SocialAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Bus;

class SyncSocialAnalytics extends Command
{
    protected $signature = 'analytics:sync {--days=7 : Number of days to sync} {--account= : Specific account ID}';
    protected $description = 'Sync social media analytics from all platforms';

    public function handle()
    {
        $days = (int) $this->option('days');
        $accountId = $this->option('account');

        $this->info("Starting social analytics sync for last {$days} days...");

        $query = SocialAccount::where('is_active', true);

        if ($accountId) {
            $query->where('id', $accountId);
        }

        $accounts = $query->get();

        if ($accounts->isEmpty()) {
            $this->warn('No active social accounts found.');
            return 0;
        }

        $this->info("Found {$accounts->count()} account(s) to sync.");

        $jobs = $accounts->map(function ($account) use ($days) {
            return new SyncSocialAnalyticsJob($account, $days);
        });

        Bus::batch($jobs->toArray())
            ->name('Social Analytics Sync')
            ->allowFailures()
            ->dispatch();

        $this->info('Analytics sync jobs dispatched successfully!');
        $this->info('Check Laravel Horizon for job progress.');

        return 0;
    }
}
