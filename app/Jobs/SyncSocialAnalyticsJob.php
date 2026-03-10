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

    try {
      Log::info("Iniciando sincronización para cuenta {$this->account->id} ({$this->account->platform})");

      // Verificar si la cuenta está activa antes de sincronizar
      if (!$this->account->is_active) {
        Log::info("Cuenta {$this->account->id} ({$this->account->platform}) está inactiva, omitiendo sincronización");
        return;
      }

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
      
      // Si es un error de autenticación/token, solo registrar como info y no reintentar
      if (str_contains($errorMessage, 'reconnection required') || 
          str_contains($errorMessage, 'No access token available') ||
          str_contains($errorMessage, '401 Unauthorized') ||
          str_contains($errorMessage, 'Invalid OAuth') ||
          str_contains($errorMessage, 'access_token_invalid')) {
        Log::info("Cuenta {$this->account->id} ({$this->account->platform}) requiere reconexión, omitiendo reintentos");
        return; // No reintentar, el usuario necesita reconectar
      }

      // Para otros errores, registrar como error y reintentar
      Log::error("Error sincronizando analytics para cuenta {$this->account->id}: {$errorMessage}");
      $this->account->increment('failure_count');
      
      if ($this->attempts() < $this->tries) {
        $this->release($this->backoff[$this->attempts() - 1] ?? 60);
      } else {
        $this->fail($e);
      }
    }
  }
}
