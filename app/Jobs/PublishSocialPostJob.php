<?php

namespace App\Jobs;

use App\Models\SocialPost;
use App\Services\SocialPlatforms\SocialPlatformFactory;
use App\Services\SocialTokenManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class PublishSocialPostJob implements ShouldQueue
{
  use Dispatchable, Queueable;

  public $tries = 3;
  public $backoff = [60, 300, 600]; // Reintentos: 1min, 5min, 10min

  public function __construct(public SocialPost $post) {}

  public function handle(SocialTokenManager $tokenManager)
  {
    $this->post->update(['status' => 'publishing']);
    $responses = [];

    foreach ($this->post->platform_targets as $accountId) {
      try {
        $account = \App\Models\SocialAccount::find($accountId);

        if (!$account || !$account->is_active) {
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

        // Publicar
        $result = $platform->publishPost($postData);
        $result['account_id'] = $accountId;
        $responses[] = $result;

        // Reiniciar contador de fallos
        $account->update(['failure_count' => 0]);
      } catch (\Exception $e) {
        \Log::error("Error publishing to account {$accountId}: " . $e->getMessage());

        $responses[] = [
          'success' => false,
          'account_id' => $accountId,
          'error' => $e->getMessage(),
        ];

        // Incrementar contador de fallos
        if ($account) {
          $account->increment('failure_count');
          if ($account->failure_count >= 3) {
            $account->update(['is_active' => false]);
          }
        }
      }
    }

    // Actualizar post
    $this->post->update([
      'status' => empty(array_filter($responses, fn($r) => $r['success'])) ? 'failed' : 'published',
      'published_at' => now(),
      'platform_responses' => $responses,
      'error_message' => empty($responses) ? 'Todas las publicaciones fallaron' : null,
    ]);
  }
}
