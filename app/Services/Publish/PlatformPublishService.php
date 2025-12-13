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
use App\Notifications\VideoUploadedNotification; 
use App\Notifications\VideoDeletedNotification; 
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;

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
      // PASO 1: Subir el video a YouTube
      $videoAbsolutePath = $this->resolveFilePath($firstMediaFile->file_path);

      $postData = [
        'video_path' => $videoAbsolutePath,
        'title' => $publication->title,
        'content' => $this->buildDescription($publication),
        'tags' => $this->extractHashtags($publication->hashtags),
        'privacy' => 'public',
        'type' => $firstMediaFile->youtube_type ?? 'regular', // Pass youtube_type from DB ('short' or 'regular')
      ];

      // Buscar Thumbnail Derivatives
      $thumbnail = $firstMediaFile->derivatives()
        ->where('derivative_type', 'thumbnail')
        ->where('platform', 'youtube')
        ->first();

      if (!$thumbnail) {
        $thumbnail = $firstMediaFile->derivatives()
          ->where('derivative_type', 'thumbnail')
          ->where('platform', 'all')
          ->first();
      }

      // Fallback: Check if there is an explicit image uploaded in the publication
      if (!$thumbnail) {
        $customThumbnail = $publication->mediaFiles
          ->where('file_type', 'image')
          ->first();

        if ($customThumbnail) {
          $postData['thumbnail_path'] = $this->resolveFilePath($customThumbnail->file_path);
        }
      } elseif ($thumbnail) {
        $postData['thumbnail_path'] = $this->resolveFilePath($thumbnail->file_path);
      }

      Log::info('Thumbnail path: ' . $postData['thumbnail_path']);

      // Upload video
      $response = $platformService->publishPost($postData);
      $uploadedPostId = $response['post_id'] ?? $response['id'] ?? null;

      // PASO 2: Marcar como publicado INMEDIATAMENTE después de subir
      $postLog = $this->logService->markAsPublished($postLog, $response);

      // Notify User
      $publication->user->notify(new VideoUploadedNotification($postLog));

      Log::info('YouTube video uploaded successfully', [
        'video_id' => $uploadedPostId,
        'publication_id' => $publication->id
      ]);
    } catch (\Exception $e) {
      // Solo marcar como fallido si el VIDEO UPLOAD falló
      $this->logService->markAsFailed($postLog, $e->getMessage());

      Log::error('YouTube video upload failed', [
        'publication_id' => $publication->id,
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'log' => $postLog->fresh(),
        'error' => $e->getMessage(),
      ];
    }

    // PASO 3: Manejar playlist DESPUÉS de que el video esté publicado
    // Si falla, NO afecta el estado del video
    $campaignGroup = $publication->campaigns->first();

    if ($campaignGroup && $uploadedPostId) {
      try {
        // Crear entrada en la cola de playlists para procesamiento en background
        \App\Models\YouTubePlaylistQueue::create([
          'social_post_log_id' => $postLog->id,
          'campaign_id' => $campaignGroup->id,
          'video_id' => $uploadedPostId,
          'playlist_id' => $campaignGroup->youtube_playlist_id, // Puede ser null
          'playlist_name' => $campaignGroup->name,
          'status' => 'pending',
        ]);

        Log::info('Playlist operation queued for background processing', [
          'video_id' => $uploadedPostId,
          'campaign' => $campaignGroup->name
        ]);
      } catch (\Exception $e) {
        // Log el error pero NO fallar la publicación
        Log::warning('Failed to queue playlist operation', [
          'video_id' => $uploadedPostId,
          'campaign' => $campaignGroup->name,
          'error' => $e->getMessage()
        ]);
      }

      // Trigger queue processing immediately in background
      try {
        Artisan::queue('youtube:process-playlist-queue');
      } catch (\Exception $e) {
        Log::warning('Could not trigger background playlist processing (Redis/Queue down?), trying sync', [
          'error' => $e->getMessage()
        ]);
        // Fallback to synchronous execution if queue is down
        try {
          Artisan::call('youtube:process-playlist-queue');
        } catch (\Exception $ex) {
          Log::error('Synchronous playlist processing also failed', ['error' => $ex->getMessage()]);
        }
      }
    }

    // Retornar éxito porque el video se subió correctamente
    return [
      'success' => true,
      'log' => $postLog,
      'error' => null,
    ];
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

      // Notify User
      $publication->user->notify(new VideoUploadedNotification($postLog));

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
    // Incluir posts publicados Y fallidos
    $logs = SocialPostLog::where('publication_id', $publication->id)
      ->whereIn('status', ['published', 'failed'])
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
          // Marcar como deleted de todas formas si no hay cuenta
          $log->update(['status' => 'deleted']);
          $results[] = [
            'log_id' => $log->id,
            'platform' => $log->platform,
            'status' => 'deleted',
            'note' => 'Account not found'
          ];
          continue;
        }

        $platformService = $this->getPlatformService($socialAccount);

        if ($log->platform_post_id) {
          try {
            // Intentar eliminar
            $deleted = $platformService->deletePost($log->platform_post_id);

            if ($deleted) {
              $log->update(['status' => 'deleted']);
              // Notify User
              $publication->user->notify(new VideoDeletedNotification($log));
              $results[] = ['log_id' => $log->id, 'platform' => $log->platform, 'status' => 'deleted'];
            } else {
              // Post no existe en plataforma - marcar como deleted de todas formas
              $log->update(['status' => 'deleted']);
              $results[] = [
                'log_id' => $log->id,
                'platform' => $log->platform,
                'status' => 'deleted',
                'note' => 'Post not found on platform'
              ];
            }
          } catch (\Exception $deleteError) {
            // Si el error es "not found" o 404, marcar como deleted
            $errorMsg = strtolower($deleteError->getMessage());
            if (
              str_contains($errorMsg, 'not found') ||
              str_contains($errorMsg, '404') ||
              str_contains($errorMsg, 'does not exist')
            ) {
              $log->update(['status' => 'deleted']);
              $results[] = [
                'log_id' => $log->id,
                'platform' => $log->platform,
                'status' => 'deleted',
                'note' => 'Already deleted or not found'
              ];
            } else {
              // Error real - reportar pero no fallar todo
              $allSuccess = false;
              $results[] = [
                'log_id' => $log->id,
                'platform' => $log->platform,
                'status' => 'failed',
                'error' => $deleteError->getMessage()
              ];
            }
          }
        } else {
          // Log marcado como posted pero sin ID - marcar como deleted
          $log->update(['status' => 'deleted']);
          $results[] = [
            'log_id' => $log->id,
            'platform' => $log->platform,
            'status' => 'deleted',
            'note' => 'No platform post ID'
          ];
        }
      } catch (\Exception $e) {
        $allSuccess = false;
        $results[] = [
          'log_id' => $log->id,
          'platform' => $log->platform ?? 'unknown',
          'status' => 'failed',
          'error' => $e->getMessage()
        ];
      }
    }

    return ['success' => $allSuccess, 'results' => $results];
  }
  /**
   * Resolve file path for local or remote storage
   */
  private function resolveFilePath(string $path): string
  {
    // If it's already a URL, return it as is
    if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
      return $path;
    }

    $disk = config('filesystems.default');

    if ($disk === 'local' || $disk === 'public') {
      return Storage::path($path);
    }

    // For S3 or other remote drivers
    try {
      return Storage::temporaryUrl($path, now()->addMinutes(60));
    } catch (\Exception $e) {
      return Storage::url($path);
    }
  }
}
