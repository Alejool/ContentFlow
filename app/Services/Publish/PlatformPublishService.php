<?php
namespace App\Services;
use App\Models\Campaigns\Campaign;
use App\Models\SocialAccount;
use App\Http\Controllers\Logs\SocialPostLogService;
use App\Services\SocialPlatforms\YouTubeService;
use App\Services\SocialPlatforms\InstagramService;
use App\Services\SocialPlatforms\FacebookService;
use App\Services\SocialPlatforms\TikTokService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlatformPublishService
{
  public function __construct(
    private SocialPostLogService $logService
  ) {}

  /**
   * Publica en YouTube (solo primer video)
   */
  public function publishToYouTube(
    Campaign $campaign,
    SocialAccount $socialAccount,
    $platformService
  ): array {
    $firstMediaFile = $campaign->mediaFiles->first();

    if (!$firstMediaFile) {
      return [
        'success' => false,
        'error' => 'No media files found',
        'log' => null,
      ];
    }

    // Crear log pendiente
    $postLog = $this->logService->createPendingLog(
      $campaign,
      $socialAccount,
      [$firstMediaFile->file_path],
      $this->buildDescription($campaign),
      $firstMediaFile->id
    );

    try {
      $response = $platformService->publishPost([
        'video_path' => $firstMediaFile->file_path,
        'title' => $campaign->title,
        'content' => $this->buildDescription($campaign),
        'tags' => $this->extractHashtags($campaign->hashtags),
        'privacy' => 'public',
      ]);

      // Marcar como publicado
      $postLog = $this->logService->markAsPublished($postLog, $response);

      return [
        'success' => true,
        'log' => $postLog,
        'error' => null,
      ];
    } catch (\Exception $e) {
      // Marcar como fallido
      $this->logService->markAsFailed($postLog, $e->getMessage());

      return [
        'success' => false,
        'log' => $postLog->fresh(),
        'error' => $e->getMessage(),
      ];
    }
  }

  /**
   * Publica en otras plataformas (múltiples archivos)
   */
  public function publishToOtherPlatform(
    Campaign $campaign,
    SocialAccount $socialAccount,
    $mediaFile,
    $platformService
  ): array {
    // Crear log pendiente
    $postLog = $this->logService->createPendingLog(
      $campaign,
      $socialAccount,
      [$mediaFile->file_path],
      $this->buildCaption($campaign),
      $mediaFile->id
    );

    try {
      $postData = [
        'video_path' => $mediaFile->file_path,
        'caption' => $this->buildCaption($campaign),
        'title' => $campaign->title,
        'description' => $campaign->description,
        'hashtags' => $campaign->hashtags,
      ];

      $response = $platformService->publishPost($postData);

      // Marcar como publicado
      $postLog = $this->logService->markAsPublished($postLog, $response);

      return [
        'success' => true,
        'log' => $postLog,
        'error' => null,
      ];
    } catch (\Exception $e) {
      // Marcar como fallido
      $this->logService->markAsFailed($postLog, $e->getMessage());

      return [
        'success' => false,
        'log' => $postLog->fresh(),
        'error' => $e->getMessage(),
      ];
    }
  }

  /**
   * Publica en todas las plataformas seleccionadas
   * TRANSACCIÓN POR PLATAFORMA (no global)
   */
  public function publishToAllPlatforms(
    Campaign $campaign,
    $socialAccounts
  ): array {
    $allLogs = [];
    $allErrors = [];
    $platformResults = [];

    foreach ($socialAccounts as $socialAccount) {
      // Transacción POR PLATAFORMA
      DB::beginTransaction();

      try {
        $platformLogs = [];
        $platformErrors = [];

        $platformService = $this->getPlatformService(
          $socialAccount->platform,
          $socialAccount->access_token
        );

        if ($socialAccount->platform === 'youtube') {
          $result = $this->publishToYouTube($campaign, $socialAccount, $platformService);

          if ($result['success']) {
            $platformLogs[] = $result['log'];
          } else {
            $platformErrors[] = [
              'media_file' => $campaign->mediaFiles->first()->file_name ?? 'Unknown',
              'message' => $result['error'],
            ];
          }
        } else {
          foreach ($campaign->mediaFiles as $mediaFile) {
            $result = $this->publishToOtherPlatform(
              $campaign,
              $socialAccount,
              $mediaFile,
              $platformService
            );

            if ($result['success']) {
              $platformLogs[] = $result['log'];
            } else {
              $platformErrors[] = [
                'media_file' => $mediaFile->file_name ?? 'Unknown',
                'message' => $result['error'],
              ];
            }
          }
        }

        // Si hay errores en esta plataforma, revertir su transacción
        if (!empty($platformErrors)) {
          DB::rollBack();

          $platformResults[$socialAccount->platform] = [
            'success' => false,
            'published' => 0,
            'failed' => count($platformErrors),
            'errors' => $platformErrors,
          ];

          $allErrors[$socialAccount->platform] = $platformErrors;
        } else {
          // Si todo fue exitoso, confirmar la transacción de esta plataforma
          DB::commit();

          $platformResults[$socialAccount->platform] = [
            'success' => true,
            'published' => count($platformLogs),
            'failed' => 0,
            'logs' => $platformLogs,
          ];

          $allLogs = array_merge($allLogs, $platformLogs);
        }
      } catch (\Exception $e) {
        DB::rollBack();

        Log::error('Platform publication error', [
          'platform' => $socialAccount->platform,
          'campaign_id' => $campaign->id,
          'error' => $e->getMessage(),
        ]);

        $platformResults[$socialAccount->platform] = [
          'success' => false,
          'published' => 0,
          'failed' => 1,
          'errors' => [['message' => $e->getMessage()]],
        ];

        $allErrors[$socialAccount->platform] = [['message' => $e->getMessage()]];
      }
    }

    return [
      'logs' => $allLogs,
      'errors' => $allErrors,
      'platform_results' => $platformResults,
      'has_errors' => !empty($allErrors),
    ];
  }

  /**
   * Reintenta una publicación fallida
   */
  public function retryPublication(SocialPostLog $postLog): array
  {
    if (!$postLog->canRetry()) {
      return [
        'success' => false,
        'error' => 'Maximum retry attempts (3) reached',
      ];
    }

    // Resetear para reintento
    $this->logService->resetForRetry($postLog);

    DB::beginTransaction();

    try {
      $campaign = $postLog->campaign;
      $socialAccount = $postLog->socialAccount;

      $platformService = $this->getPlatformService(
        $socialAccount->platform,
        $socialAccount->access_token
      );

      if ($socialAccount->platform === 'youtube') {
        $result = $this->retryYouTubePublication($postLog, $campaign, $platformService);
      } else {
        $result = $this->retryOtherPlatformPublication($postLog, $campaign, $platformService);
      }

      if ($result['success']) {
        DB::commit();
      } else {
        DB::rollBack();
      }

      return $result;
    } catch (\Exception $e) {
      DB::rollBack();

      $this->logService->markAsFailed($postLog, "Retry failed: {$e->getMessage()}");

      return [
        'success' => false,
        'error' => $e->getMessage(),
      ];
    }
  }

  private function retryYouTubePublication($postLog, $campaign, $platformService): array
  {
    try {
      $mediaFile = $postLog->mediaFile ?? $campaign->mediaFiles->first();

      $response = $platformService->publishPost([
        'video_path' => $mediaFile->file_path,
        'title' => $campaign->title,
        'content' => $this->buildDescription($campaign),
        'tags' => $this->extractHashtags($campaign->hashtags),
        'privacy' => 'public',
      ]);

      $this->logService->markAsPublished($postLog, $response);

      return [
        'success' => true,
        'log' => $postLog->fresh(),
      ];
    } catch (\Exception $e) {
      $this->logService->markAsFailed($postLog, "Retry failed: {$e->getMessage()}");

      return [
        'success' => false,
        'error' => $e->getMessage(),
      ];
    }
  }

  private function retryOtherPlatformPublication($postLog, $campaign, $platformService): array
  {
    try {
      $mediaFile = $postLog->mediaFile;

      if (!$mediaFile) {
        throw new \Exception('Media file not found');
      }

      $response = $platformService->publishPost([
        'video_path' => $mediaFile->file_path,
        'caption' => $this->buildCaption($campaign),
        'title' => $campaign->title,
        'description' => $campaign->description,
        'hashtags' => $campaign->hashtags,
      ]);

      $this->logService->markAsPublished($postLog, $response);

      return [
        'success' => true,
        'log' => $postLog->fresh(),
      ];
    } catch (\Exception $e) {
      $this->logService->markAsFailed($postLog, "Retry failed: {$e->getMessage()}");

      return [
        'success' => false,
        'error' => $e->getMessage(),
      ];
    }
  }

  private function buildDescription(Campaign $campaign): string
  {
    $parts = [];

    if ($campaign->description) {
      $parts[] = $campaign->description;
    }

    if ($campaign->hashtags) {
      $parts[] = $campaign->hashtags;
    }

    return implode("\n\n", array_filter($parts));
  }

  private function buildCaption(Campaign $campaign): string
  {
    $parts = [];

    if ($campaign->title) {
      $parts[] = $campaign->title;
    }

    if ($campaign->description) {
      $parts[] = $campaign->description;
    }

    if ($campaign->hashtags) {
      $parts[] = $campaign->hashtags;
    }

    return implode("\n\n", array_filter($parts));
  }

  private function extractHashtags(?string $hashtags): array
  {
    if (empty($hashtags)) {
      return [];
    }

    preg_match_all('/#(\w+)/', $hashtags, $matches);
    return $matches[1] ?? [];
  }

  private function getPlatformService(string $platform, string $accessToken)
  {
    return match ($platform) {
      'youtube' => new YouTubeService($accessToken),
      'instagram' => new InstagramService($accessToken),
      'facebook' => new FacebookService($accessToken),
      'tiktok' => new TikTokService($accessToken),
      default => throw new \Exception("Unsupported platform: {$platform}"),
    };
  }
}
