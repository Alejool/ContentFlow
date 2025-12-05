<?php

namespace App\Jobs;

use App\Models\SocialAccount;
use App\Models\SocialMetric;
use App\Services\SocialPlatforms\SocialPlatformFactory;
use App\Services\SocialTokenManager;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncSocialAnalyticsJob implements ShouldQueue
{
  use Batchable, Queueable;

  public function __construct(
    public SocialAccount $account,
    public $days = 7
  ) {}

  public function handle(SocialTokenManager $tokenManager)
  {
    try {
      $token = $tokenManager->getValidToken($this->account);
      $platform = SocialPlatformFactory::make($this->account->platform, $token);

      // Obtener estadísticas de la cuenta
      $accountMetrics = $platform->getAccountMetrics($this->days);

      // Obtener estadísticas de posts recientes
      $posts = $this->account->posts()
        ->where('published_at', '>=', now()->subDays($this->days))
        ->get();

      foreach ($posts as $post) {
        if ($post->platform_post_id) {
          $postMetrics = $platform->getPostAnalytics($post->platform_post_id);

          SocialMetric::updateOrCreate(
            [
              'social_account_id' => $this->account->id,
              'social_post_id' => $post->id,
              'metric_date' => now()->toDateString(),
            ],
            [
              'metrics' => array_merge($postMetrics, ['synced_at' => now()])
            ]
          );
        }
      }

      // Actualizar última sincronización
      $this->account->update([
        'last_synced_at' => now(),
        'failure_count' => 0,
      ]);
    } catch (\Exception $e) {
      \Log::error("Error syncing analytics for account {$this->account->id}: " . $e->getMessage());
      $this->account->increment('failure_count');
    }
  }
}
