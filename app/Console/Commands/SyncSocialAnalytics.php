<?php

namespace App\Console\Commands;

use App\Models\SocialAccount;
use App\Jobs\SyncSocialAnalyticsJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Bus;

class SyncSocialAnalytics extends Command
{
  protected $signature = 'social:sync-analytics {--days=7}';

  public function handle()
  {
    $accounts = SocialAccount::where('is_active', true)->get();
    $jobs = [];

    foreach ($accounts as $account) {
      $jobs[] = new SyncSocialAnalyticsJob($account, $this->option('days'));
    }

    if (!empty($jobs)) {
      Bus::batch($jobs)
        ->name('Sync Social Analytics')
        ->allowFailures()
        ->dispatch();

      $this->info("Sincronización iniciada para {$accounts->count()} cuentas");
    }
  }
}
