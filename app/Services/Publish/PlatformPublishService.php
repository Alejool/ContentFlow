<?php

namespace App\Services\Publish;

use App\Models\Publications\Publication;
use App\Models\SocialAccount;
use App\Models\SocialPostLog;
use App\Services\Logs\SocialPostLogService;
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
    Publication $publication,
    SocialAccount $socialAccount,
    $platformService
  ): array {
    $firstMediaFile = $publication->mediaFiles->first();

    if (!$firstMediaFile) {
      return [
        'success' => false,
        'error' => 'No media files found',
        'log' => null,
      ];
    }

    // Crear log pendiente
    $postLog = $this->logService->createPendingLog(
      $publication,
      $socialAccount,
      [$firstMediaFile->file_path],
      $this->buildDescription($publication),
      $firstMediaFile->id
    );

    $uploadedPostId = null;

    try {
      $postData = [
        'video_path' => $firstMediaFile->file_path,
        'title' => $publication->title,
        'content' => $this->buildDescription($publication),
        'tags' => $this->extractHashtags($publication->hashtags),
        'privacy' => 'public',
      ];

      // Buscar Thumbnail Derivatives
      $thumbnail = $firstMediaFile->derivatives()
        ->where('derivative_type', 'thumbnail')
        ->where('platform', 'youtube')
        ->first(); // Prioritize YouTube specific thumbnail

      if (!$thumbnail) {
        $thumbnail = $firstMediaFile->derivatives()
          ->where('derivative_type', 'thumbnail')
          ->first(); // Fallback to generic thumbnail
      }

      if ($thumbnail) {
        $postData['thumbnail_path'] = $thumbnail->file_path; // Asumiendo URL o path accesible
      }

      $response = $platformService->publishPost($postData);
      $uploadedPostId = $response['post_id'] ?? $response['id'] ?? null;

      // --- LOGICA DE PLAYLIST ---
      // Si la publicación pertenece a una Campaña (agrupación), agregar a Playlist
      $campaignGroup = $publication->campaigns->first();

      if ($campaignGroup) {
        try {
          $playlistId = $campaignGroup->youtube_playlist_id;

          // Si la campaña no tiene playlist asignada, buscar o crear
          if (!$playlistId) {
            // Intentar buscar por nombre
            $playlistId = $platformService->findPlaylistByName($campaignGroup->name);

            // Si no existe, crear nueva
            if (!$playlistId) {
              $playlistId = $platformService->createPlaylist(
                $campaignGroup->name,
                $campaignGroup->description ?? $campaignGroup->name
              );
            }

            // Guardar ID en la campaña
            if ($playlistId) {
              $campaignGroup->youtube_playlist_id = $playlistId;
              $campaignGroup->save();
            } else {
              throw new \Exception("Could not find or create playlist '{$campaignGroup->name}'");
            }
          }

          // Agregar video a la playlist
          if ($playlistId && $uploadedPostId) {
            $added = $platformService->addVideoToPlaylist($playlistId, $uploadedPostId);
            if (!$added) {
              throw new \Exception("Video uploaded but failed to add to playlist '{$campaignGroup->name}'");
            }
          }
        } catch (\Exception $e) {
          Log::error('Failed to handle YouTube Playlist', ['error' => $e->getMessage()]);
          // Re-lanzar excepción para que falle la publicación completa y haga rollback
          throw $e;
        }
      }
      // --------------------------

      // Marcar como publicado
      $postLog = $this->logService->markAsPublished($postLog, $response);

      return [
        'success' => true,
        'log' => $postLog,
        'error' => null,
      ];
    } catch (\Exception $e) {
      // Rollback: Eliminar video si se subió pero falló algo más (ej. Playlist)
      if ($uploadedPostId) {
        try {
          $platformService->deletePost($uploadedPostId);
          Log::info('Rolled back YouTube upload due to secondary error', ['video_id' => $uploadedPostId]);
        } catch (\Exception $de) {
          Log::error('Failed to rollback YouTube upload', ['video_id' => $uploadedPostId, 'error' => $de->getMessage()]);
        }
      }

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
    Publication $publication,
    SocialAccount $socialAccount,
    $mediaFile,
    $platformService
  ): array {
    // Crear log pendiente
    $postLog = $this->logService->createPendingLog(
      $publication,
      $socialAccount,
      [$mediaFile->file_path],
      $this->buildCaption($publication),
      $mediaFile->id
    );

    try {
      $postData = [
        'video_path' => $mediaFile->file_path,
        'caption' => $this->buildCaption($publication),
        'title' => $publication->title,
        'description' => $publication->description,
        'hashtags' => $publication->hashtags,
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
    Publication $publication,
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

        $platformService = $this->getPlatformService($socialAccount);

        if ($socialAccount->platform === 'youtube') {
          $result = $this->publishToYouTube($publication, $socialAccount, $platformService);

          if ($result['success']) {
            $platformLogs[] = $result['log'];
          } else {
            $platformErrors[] = [
              'media_file' => $publication->mediaFiles->first()->file_name ?? 'Unknown',
              'message' => $result['error'],
            ];
          }
        } else {
          foreach ($publication->mediaFiles as $mediaFile) {
            $result = $this->publishToOtherPlatform(
              $publication,
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
          'campaign_id' => $publication->id,
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
      $publication = $postLog->publication;
      $socialAccount = $postLog->socialAccount;

      $platformService = $this->getPlatformService($socialAccount);

      if ($socialAccount->platform === 'youtube') {
        $result = $this->retryYouTubePublication($postLog, $publication, $platformService);
      } else {
        $result = $this->retryOtherPlatformPublication($postLog, $publication, $platformService);
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

  private function retryYouTubePublication($postLog, $publication, $platformService): array
  {
    try {
      $mediaFile = $postLog->mediaFile ?? $publication->mediaFiles->first();

      $response = $platformService->publishPost([
        'video_path' => $mediaFile->file_path,
        'title' => $publication->title,
        'content' => $this->buildDescription($publication),
        'tags' => $this->extractHashtags($publication->hashtags),
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

  private function retryOtherPlatformPublication($postLog, $publication, $platformService): array
  {
    try {
      $mediaFile = $postLog->mediaFile;

      if (!$mediaFile) {
        throw new \Exception('Media file not found');
      }

      $response = $platformService->publishPost([
        'video_path' => $mediaFile->file_path,
        'caption' => $this->buildCaption($publication),
        'title' => $publication->title,
        'description' => $publication->description,
        'hashtags' => $publication->hashtags,
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

  private function buildDescription(Publication $publication): string
  {
    $parts = [];

    if ($publication->description) {
      $parts[] = $publication->description;
    }

    if ($publication->hashtags) {
      $parts[] = $publication->hashtags;
    }

    return implode("\n\n", array_filter($parts));
  }

  private function buildCaption(Publication $publication): string
  {
    $parts = [];

    if ($publication->title) {
      $parts[] = $publication->title;
    }

    if ($publication->description) {
      $parts[] = $publication->description;
    }

    if ($publication->hashtags) {
      $parts[] = $publication->hashtags;
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

  private function getPlatformService(SocialAccount $socialAccount)
  {
    return match ($socialAccount->platform) {
      'youtube' => new YouTubeService($socialAccount->access_token, $socialAccount),
      'instagram' => new InstagramService($socialAccount->access_token, $socialAccount),
      'facebook' => new FacebookService($socialAccount->access_token, $socialAccount),
      'tiktok' => new TikTokService($socialAccount->access_token, $socialAccount),
      default => throw new \Exception("Unsupported platform: {$socialAccount->platform}"),
    };
  }
  /**
   * Elimina la publicación de todas las plataformas sociales
   */
  public function unpublishFromAllPlatforms(Publication $publication): array
  {
    $logs = SocialPostLog::where('publication_id', $publication->id)
      ->where('status', 'published')
      ->get();

    $results = [];
    $allSuccess = true;

    // Si no hay logs publicados, consideramos éxito (nada que borrar)
    if ($logs->isEmpty()) {
      return ['success' => true, 'message' => 'No active posts found', 'results' => []];
    }

    foreach ($logs as $log) {
      try {
        $socialAccount = $log->socialAccount;

        if (!$socialAccount) {
          $results[] = ['log_id' => $log->id, 'platform' => $log->platform, 'status' => 'failed', 'error' => 'Account not found'];
          $allSuccess = false;
          continue;
        }

        $platformService = $this->getPlatformService($socialAccount);

        if ($log->platform_post_id) {
          // Intentar eliminar
          $deleted = $platformService->deletePost($log->platform_post_id);

          if ($deleted) {
            $log->update(['status' => 'deleted']);
            $results[] = ['log_id' => $log->id, 'platform' => $log->platform, 'status' => 'deleted'];
          } else {
            // Si falla, quizás ya fue borrado o error de red
            // Deberíamos marcar error, y el usuario tendrá que decidir.
            // El requerimiento dice: "se elimine si falla algo y luego si volver a permitir publicarlo"
            // Interpretación: Si falla, NO permitir proceder.
            $allSuccess = false;
            $results[] = ['log_id' => $log->id, 'platform' => $log->platform, 'status' => 'failed', 'error' => 'Failed to delete on platform'];
          }
        } else {
          // Log marcado como posted pero sin ID? Raro.
          $log->update(['status' => 'deleted']); // Asumimos borrado lógico
        }
      } catch (\Exception $e) {
        $allSuccess = false;
        $results[] = ['log_id' => $log->id, 'platform' => $log->platform ?? 'unknown', 'status' => 'failed', 'error' => $e->getMessage()];
      }
    }

    return ['success' => $allSuccess, 'results' => $results];
  }
}
