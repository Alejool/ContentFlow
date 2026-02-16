<?php

namespace App\Console\Commands;

use App\Models\Social\SocialAccount;
use App\Jobs\SyncSocialAnalyticsJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Bus;

class SyncSocialAnalytics extends Command
{
  protected $signature = 'social:sync-analytics {--days=7}';
  protected $description = 'Sincronizar analytics de todas las cuentas sociales activas';

  public function handle()
  {
    $accounts = SocialAccount::where('is_active', true)->get();
    
    if ($accounts->isEmpty()) {
      $this->warn('No hay cuentas activas para sincronizar');
      return 0;
    }

    $jobs = [];
    foreach ($accounts as $account) {
      $jobs[] = new SyncSocialAnalyticsJob($account, $this->option('days'));
    }

    $batch = Bus::batch($jobs)
      ->name('Sync Social Analytics')
      ->allowFailures()
      ->onQueue('default')
      ->dispatch();

    $this->info("✓ Batch creado: {$batch->id}");
    $this->info("✓ Sincronización iniciada para {$accounts->count()} cuentas");
    $this->line('');
    $this->comment('Para procesar los jobs, ejecuta:');
    $this->line('  php artisan queue:work --queue=default');
    
    return 0;
  }
}
