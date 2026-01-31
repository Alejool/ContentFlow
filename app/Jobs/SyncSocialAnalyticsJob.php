<?php

namespace App\Jobs;

use App\Models\Social\SocialAccount;
use App\Services\SocialAnalyticsService;
use Illuminate\Support\Facades\Log;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;


class SyncSocialAnalyticsJob implements ShouldQueue
{
  use Batchable, Queueable;

  public function __construct(
    public SocialAccount $account,
    public $days = 7
  ) {}

  public function handle(SocialAnalyticsService $analyticsService)
  {
    try {
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
      Log::error("Error syncing analytics for account {$this->account->id}: " . $e->getMessage());
      $this->account->increment('failure_count');
    }
  }
}
