<?php

namespace App\Jobs;

use App\Models\Social\SocialAccount;
use App\Services\SocialAnalyticsService;
use Illuminate\Support\Facades\Log;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SyncSocialAnalyticsJob implements ShouldQueue
{
  use Batchable, Queueable, InteractsWithQueue, Dispatchable;

  public $tries = 3;
  public $timeout = 120;
  public $backoff = [60, 120, 300];

  public function __construct(
    public SocialAccount $account,
    public $days = 7
  ) {}

  public function handle(SocialAnalyticsService $analyticsService)
  {
    if ($this->batch()?->cancelled()) {
      return;
    }

    // Skip inactive accounts
    if (!$this->account->is_active) {
      Log::info("Skipping inactive account {$this->account->id} ({$this->account->platform})");
      return;
    }

    try {
      Log::info("Iniciando sincronización para cuenta {$this->account->id} ({$this->account->platform})");

      // 1. Sincronizar métricas de la cuenta (seguidores, posts, etc.)
      $analyticsService->fetchAccountMetrics($this->account);

      // 2. Sincronizar métricas de posts recientes
      $analyticsService->syncRecentPostsMetrics($this->account, $this->days);

      // 3. Actualizar estado de la cuenta
      $this->account->update([
        'last_synced_at' => now(),
        'failure_count' => 0,
      ]);

      Log::info("Sincronización completada para cuenta {$this->account->id} ({$this->account->platform})");
    } catch (\Exception $e) {
      $errorMessage = $e->getMessage();
      
      // Don't retry if it's a token/reconnection issue
      if (str_contains($errorMessage, 'reconnection required') || 
          str_contains($errorMessage, 'No access token available')) {
        Log::warning("Account {$this->account->id} needs reconnection, skipping retries: {$errorMessage}");
        $this->account->increment('failure_count');
        return; // Don't retry, user needs to reconnect
      }

      Log::error("Error syncing analytics for account {$this->account->id}: {$errorMessage}");
      $this->account->increment('failure_count');
      
      if ($this->attempts() < $this->tries) {
        $this->release($this->backoff[$this->attempts() - 1] ?? 60);
      } else {
        $this->fail($e);
      }
    }
  }
}
