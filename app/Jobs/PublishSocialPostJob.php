<?php

namespace App\Jobs;

use App\Models\Publications\Publication;
use App\Services\SocialPlatforms\SocialPlatformFactory;
use App\Services\SocialTokenManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use App\Models\Social\SocialAccount;
use Illuminate\Support\Facades\Log;

class PublishSocialPostJob implements ShouldQueue
{
  use Dispatchable, Queueable;

  public $tries = 3;
  public $backoff = [60, 300, 600]; // Reintentos: 1min, 5min, 10min

  public function __construct(public Publication $post) {}

  public function handle(SocialTokenManager $tokenManager)
  {
    // Verificar si la publicación fue cancelada antes de procesar
    $this->post->refresh();
    
    if (in_array($this->post->status, ['failed', 'cancelled'])) {
      Log::info("Publication {$this->post->id} was cancelled or failed, skipping job execution");
      $this->delete(); // Eliminar el job de la cola para evitar reintentos
      return;
    }
    
    $this->post->update(['status' => 'publishing']);
    $responses = [];

    foreach ($this->post->platform_targets as $accountId) {
      // Verificar nuevamente antes de cada plataforma
      $this->post->refresh();
      if (in_array($this->post->status, ['failed', 'cancelled'])) {
        Log::info("Publication {$this->post->id} was cancelled during processing, stopping");
        $this->delete();
        return;
      }
      
      try {
        $account = SocialAccount::find($accountId);

        if (!$account || !$account->is_active) {
          continue;
        }

        // Verificar si esta plataforma específica fue cancelada
        $log = $this->post->socialPostLogs()
          ->where('social_account_id', $accountId)
          ->first();
          
        if ($log && $log->status === 'failed' && $log->error_message === 'Cancelado por el usuario') {
          Log::info("Platform {$accountId} for publication {$this->post->id} was cancelled, skipping");
          continue;
        }

        // Obtener token válido
        $token = $tokenManager->getValidToken($account);

        // Crear instancia de la plataforma
        $platform = SocialPlatformFactory::make($account->platform, $token);

        // Preparar datos para publicación
        $postData = [
          'content' => $this->post->content,
          'media_url' => $this->post->media_urls[0] ?? null,
          'link' => $this->post->link ?? null,
          'account_type' => $account->account_type ?? 'profile',
        ];

        Log::info('Uploading data 5------', ['postData' => $postData]);
        $result = $platform->publishPost($postData);
        $result['account_id'] = $accountId;
        $responses[] = $result;

        $account->update(['failure_count' => 0]);
      } catch (\Exception $e) {
        \Log::error("Error publishing to account {$accountId}: " . $e->getMessage());

        $responses[] = [
          'success' => false,
          'account_id' => $accountId,
          'error' => $e->getMessage(),
        ];

        if ($account) {
          $account->increment('failure_count');
          if ($account->failure_count >= 3) {
            $account->update(['is_active' => false]);
          }
        }
      }
    }

    $this->post->update([
      'status' => empty(array_filter($responses, fn($r) => $r['success'])) ? 'failed' : 'published',
      'published_at' => now(),
      'platform_responses' => $responses,
      'error_message' => empty($responses) ? 'Todas las publicaciones fallaron' : null,
    ]);
  }
}
