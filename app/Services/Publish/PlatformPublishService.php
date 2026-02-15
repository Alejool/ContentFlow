<?php

namespace App\Services\Publish;

use App\Services\SocialPlatforms\YouTubeService;
use App\Services\SocialPlatforms\InstagramService;
use App\Services\SocialPlatforms\FacebookService;
use App\Services\SocialPlatforms\TikTokService;
use App\Services\SocialPlatforms\TwitterService;
use App\Notifications\VideoUploadedNotification;
use App\Notifications\VideoDeletedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;


use App\Models\YouTube\YouTubePlaylistQueue;
use App\Models\Publications\Publication;
use App\Models\Social\SocialAccount;
use App\Models\Social\SocialPostLog;
use App\Services\Log\SocialPostLogService;

use App\Events\PublicationStatusUpdated;
use App\Jobs\VerifyYouTubeVideoStatus;

use App\DTOs\SocialPostDTO;

use App\Notifications\PublicationPostFailedNotification;
use App\Notifications\PublicationResultNotification;


class PlatformPublishService
{
  public function __construct(
    private SocialPostLogService $logService
  ) {}

  /**
   * Initialize logs for all platforms (Create or Update to Pending)
   * Ensures uniqueness by removing stale logs for these accounts.
   */
  public function initializeLogs(Publication $publication, $socialAccounts, string $initialStatus = 'pending'): array
  {
    $preparedLogs = [];
    $allLogIds = [];

    foreach ($socialAccounts as $socialAccount) {
      $accountLogs = [];

      try {
        if ($socialAccount->platform === 'youtube') {
          $firstMediaFile = $publication->mediaFiles->first();
          $log = $this->logService->createPendingLog(
            $publication,
            $socialAccount,
            $firstMediaFile ? [$firstMediaFile->file_path] : [],
            $this->buildDescription($publication),
            $firstMediaFile ? $firstMediaFile->id : null,
            $initialStatus
          );
          $accountLogs[] = ['type' => 'youtube', 'log' => $log, 'media' => null];
          $allLogIds[] = $log->id;
        } else {
          if ($publication->mediaFiles->isNotEmpty()) {
            foreach ($publication->mediaFiles as $mediaFile) {
              $log = $this->logService->createPendingLog(
                $publication,
                $socialAccount,
                [$mediaFile->file_path],
                $this->buildCaption($publication),
                $mediaFile->id,
                $initialStatus
              );
              $accountLogs[] = ['type' => 'other', 'log' => $log, 'media' => $mediaFile];
              $allLogIds[] = $log->id;
            }
          } else {
            // Create a single log to record the failure of having no media
            $log = $this->logService->createPendingLog(
              $publication,
              $socialAccount,
              [],
              $this->buildCaption($publication),
              null,
              $initialStatus
            );
            $accountLogs[] = ['type' => 'other', 'log' => $log, 'media' => null];
            $allLogIds[] = $log->id;
            Log::info('Created pending log (no media)', ['log_id' => $log->id]);
          }
        }

        $preparedLogs[$socialAccount->id] = $accountLogs;
      } catch (\Exception $e) {
        Log::error('Failed to initialize logs for account', ['account_id' => $socialAccount->id, 'error' => $e->getMessage()]);
        // We can't return logs for this account.
      }
    }

    // CLEANUP STALE LOGS
    // Remove any logs for these accounts/publication that are NOT in the new list
    // This ensures that if media changed, old failed logs are removed
    if (!empty($allLogIds)) {
      SocialPostLog::where('publication_id', $publication->id)
        ->whereIn('social_account_id', $socialAccounts->pluck('id'))
        ->whereNotIn('id', $allLogIds)
        ->delete();
    }

    return $preparedLogs;
  }

  /**
   * Publish to platform using Strategy Pattern
   */
  public function publishToPlatform(
    Publication $publication,
    SocialAccount $socialAccount,
    $platformService,
    SocialPostLog $postLog
  ): array {
    try {
      $postDto = $this->buildSocialPostDTO($publication, $socialAccount, $postLog);

      /** @var \App\Interfaces\SocialPlatformInterface $platformService */
      $result = $platformService->publish($postDto);

      if ($result->success) {
        $response = array_merge([
          'post_id' => $result->postId,
          'url' => $result->postUrl,
          'status' => 'published',
        ], $result->rawData);

        $postLog = $this->logService->markAsPublished($postLog, $response);

        // YouTube Specific background tasks
        if ($socialAccount->platform === 'youtube' && $result->postId) {
          VerifyYouTubeVideoStatus::dispatch($postLog)->delay(now()->addMinutes(5));
          $this->handleYouTubePlaylist($publication, $postLog, $result->postId);
        }

        $publication->user->notify(new VideoUploadedNotification($postLog));

        // Notify Workspace via Webhooks
        if ($publication->workspace) {
          $publication->workspace->notify(new PublicationResultNotification($postLog, 'published'));
        }


        return [
          'success' => true,
          'log' => $postLog,
          'error' => null,
        ];
      } else {
        $this->logService->markAsFailed($postLog, $result->errorMessage);

        // Notify Workspace via Webhooks
        if ($publication->workspace) {
          $publication->workspace->notify(new PublicationResultNotification($postLog, 'failed', $result->errorMessage));
        }

        return [
          'success' => false,
          'error' => $result->errorMessage,
          'log' => $postLog->fresh(),
        ];
      }
    } catch (\Throwable $e) {
      Log::error('Publication failed', ['account' => $socialAccount->platform, 'error' => $e->getMessage()]);
      $this->logService->markAsFailed($postLog, $e->getMessage());

      // Notify Workspace via Webhooks
      if ($publication->workspace) {
        $publication->workspace->notify(new PublicationResultNotification($postLog, 'failed', $e->getMessage()));
      }

      return [
        'success' => false,
        'log' => $postLog->fresh(),
        'error' => $e->getMessage(),
      ];
    }
  }

  private function buildSocialPostDTO(Publication $publication, SocialAccount $socialAccount, SocialPostLog $postLog): SocialPostDTO
  {
    $mediaPaths = [];
    if ($socialAccount->platform === 'youtube' || $socialAccount->platform === 'tiktok') {
      $mediaFile = $publication->mediaFiles->first();
      if ($mediaFile) {
        $mediaPaths[] = $this->resolveFilePath($mediaFile->file_path);
      }
    } else {
      $mediaFile = $postLog->mediaFile ?? $publication->mediaFiles->first();
      if ($mediaFile) {
        $mediaPaths[] = $this->resolveFilePath($mediaFile->file_path);
      }
    }

    $metadata = [];
    if ($socialAccount->platform === 'youtube') {
      $metadata['thumbnail_path'] = $this->getYoutubeThumbnailPath($publication);
    }
    $pSettings = $postLog->platform_settings ?? $publication->platform_settings ?? [];

    if (is_string($pSettings)) {
      $pSettings = json_decode($pSettings, true) ?? [];
    }

    return new SocialPostDTO(
      content: $this->buildCaption($publication),
      mediaPaths: $mediaPaths,
      title: $publication->title,
      hashtags: $this->extractHashtags($publication->hashtags),
      metadata: $metadata,
      platformSettings: (array) $pSettings
    );
  }

  private function getYoutubeThumbnailPath(Publication $publication): ?string
  {
    $firstMediaFile = $publication->mediaFiles->first();
    if (!$firstMediaFile)
      return null;

    $thumbnail = $firstMediaFile->derivatives()
      ->where('derivative_type', 'thumbnail')
      ->whereIn('platform', ['youtube', 'all'])
      ->first();

    if ($thumbnail) {
      return $this->resolveFilePath($thumbnail->file_path);
    }

    $customThumbnail = $publication->mediaFiles->where('file_type', 'image')->first();
    return $customThumbnail ? $this->resolveFilePath($customThumbnail->file_path) : null;
  }

  private function handleYouTubePlaylist(Publication $publication, SocialPostLog $postLog, string $uploadedPostId): void
  {
    $campaignGroup = $publication->campaigns->first();
    if (!$campaignGroup)
      return;

    try {
      YouTubePlaylistQueue::create([
        'social_post_log_id' => $postLog->id,
        'campaign_id' => $campaignGroup->id,
        'video_id' => $uploadedPostId,
        'playlist_id' => $campaignGroup->youtube_playlist_id,
        'playlist_name' => $campaignGroup->name,
        'status' => 'pending',
      ]);
      Artisan::queue('youtube:process-playlist-queue');
    } catch (\Exception $e) {
      Log::warning('Failed to queue playlist operation', ['video_id' => $uploadedPostId, 'error' => $e->getMessage()]);
    }
  }

  /**
   * Publish to all selected platforms
   * TRANSACTION PER PLATFORM (not global)
   */
  public function publishToAllPlatforms(
    Publication $publication,
    $socialAccounts
  ): array {

    Log::info('publishToAllPlatforms', ['publication' => $publication, 'socialAccounts' => $socialAccounts]);
    $allLogs = [];
    $allErrors = [];
    $platformResults = [];

    // Initialize/Update logs for ALL accounts first (idempotent)
    try {
      $preparedLogsMap = $this->initializeLogs($publication, $socialAccounts);
    } catch (\Exception $e) {
      Log::error('Log initialization failed globally', ['publication_id' => $publication->id, 'error' => $e->getMessage()]);
      return [
        'success' => false,
        'message' => 'Failed to initialize logs: ' . $e->getMessage(),
        'platform_results' => [],
      ];
    }

    foreach ($socialAccounts as $socialAccount) {
      $platformLogs = [];
      $platformErrors = [];

      // Retrieve pre-created logs
      if (!isset($preparedLogsMap[$socialAccount->id])) {
        $msg = 'Failed to initialize logs for platform: ' . $socialAccount->platform;
        $allErrors[$socialAccount->platform] = [['message' => $msg]];
        $platformResults[$socialAccount->platform] = [
          'success' => false,
          'published' => 0,
          'failed' => 1,
          'errors' => [['message' => $msg]],
          'logs' => [],
        ];
        Log::error($msg);
        continue;
      }

      $pendingLogs = $preparedLogsMap[$socialAccount->id];

      DB::beginTransaction();

      try {
        $platformService = $this->getPlatformService($socialAccount);
        foreach ($pendingLogs as $item) {
          $postLog = $item['log'];
          Log::info('Processing log inside transaction', ['log_id' => $postLog->id]);

          $result = $this->publishToPlatform($publication, $socialAccount, $platformService, $postLog);

          if (isset($result['log'])) {
            $platformLogs[] = $result['log'];
          }

          if (!$result['success']) {
            $platformErrors[] = [
              'media_file' => $publication->mediaFiles->first()->file_name ?? 'Unknown',
              'message' => $result['error'],
            ];
          }
        }

        if (!empty($platformErrors)) {
          Log::info('Errors occurred, committing logs anyway', ['errors' => count($platformErrors)]);
          DB::commit();

          $publication->user->notify(new PublicationPostFailedNotification(
            $socialAccount->platform,
            $platformErrors[0]['message'] ?? 'Unknown error',
            $publication->title
          ));

          $platformResults[$socialAccount->platform] = [
            'success' => false,
            'published' => count(array_filter($platformLogs, fn($l) => $l->status === 'published')),
            'failed' => count($platformErrors),
            'errors' => $platformErrors,
            'logs' => $platformLogs,
          ];

          $allErrors[$socialAccount->platform] = $platformErrors;
          $allLogs = array_merge($allLogs, $platformLogs);
        } else {
          Log::info('Success, committing transaction');
          DB::commit();

          $platformResults[$socialAccount->platform] = [
            'success' => true,
            'published' => count($platformLogs),
            'failed' => 0,
            'logs' => $platformLogs,
          ];


          $allLogs = array_merge($allLogs, $platformLogs);
        }

        // Broadcast progress after each platform
        event(new PublicationStatusUpdated(
          userId: $publication->user_id,
          publicationId: $publication->id,
          status: 'publishing'
        ));

        // Use full namespace to avoid adding 'use' statement if possible, or add it at top.
        // I will add it at top for cleanliness.
        event(new \App\Events\Publications\PublicationUpdated($publication));
      } catch (\Throwable $e) {
        Log::warning('Exception caught, rolling back transaction', ['error' => $e->getMessage()]);
        DB::rollBack();

        Log::info('Transaction rolled back. Now marking pending logs as failed.');
        Log::info('Transaction rolled back. Now marking pending logs as failed.');
        foreach ($pendingLogs as $item) {
          Log::info('Marking log failed', ['log_id' => $item['log']->id]);
          try {
            // Reload log to ensure we have the fresh instance not attached to rolled-back context if applicable
            $logElement = $item['log']->fresh();

            if ($logElement) {
              $this->logService->markAsFailed($logElement, $e->getMessage());
            } else {
              Log::warning('Log element not found during rollback recovery (likely rolled back). Re-creating...', ['id' => $item['log']->id]);

              // Re-create the log to ensure persistence
              // We use the data from the in-memory $item['log'] object which still holds the attributes
              $oldLog = $item['log'];

              try {
                $newLog = SocialPostLog::create([
                  'user_id' => $oldLog->user_id,
                  'workspace_id' => $oldLog->workspace_id,
                  'social_account_id' => $oldLog->social_account_id,
                  'publication_id' => $oldLog->publication_id,
                  'media_file_id' => $oldLog->media_file_id,
                  'platform' => $oldLog->platform,
                  'account_name' => $oldLog->account_name,
                  'content' => $oldLog->content,
                  'media_urls' => $oldLog->media_urls,
                  'status' => 'failed',
                  'error_message' => substr($e->getMessage(), 0, 65000),
                  'retry_count' => 0,
                ]);
                Log::info('Log re-created successfully after rollback', ['new_id' => $newLog->id]);
              } catch (\Exception $createError) {
                Log::error('Failed to re-create log after rollback', ['error' => $createError->getMessage()]);
              }
            }
          } catch (\Throwable $logError) {
            Log::emergency('Could not update log after rollback. Log might be lost.', [
              'log_id' => $item['log']->id,
              'original_error' => $e->getMessage(),
              'log_error' => $logError->getMessage()
            ]);
          }
        }

        Log::error('Platform publication error (handled)', [
          'platform' => $socialAccount->platform,
          'campaign_id' => $publication->id,
          'error' => $e->getMessage(),
          'trace' => $e->getTraceAsString(),
        ]);


        // Notify about failure
        $publication->user->notify(new PublicationPostFailedNotification(
          $socialAccount->platform,
          $e->getMessage(),
          $publication->title
        ));

        $platformResults[$socialAccount->platform] = [
          'success' => false,
          'published' => 0,
          'failed' => count($pendingLogs),
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
   * Retry a failed publication
   */
  public function retryPublication(SocialPostLog $postLog): array
  {
    if (!$postLog->canRetry()) {
      return [
        'success' => false,
        'error' => 'Maximum retry attempts (3) reached',
      ];
    }

    // Reset for retry
    $this->logService->resetForRetry($postLog);

    DB::beginTransaction();

    try {
      $publication = $postLog->publication;
      $socialAccount = $postLog->socialAccount;

      $platformService = $this->getPlatformService($socialAccount);

      $result = $this->publishToPlatform($publication, $socialAccount, $platformService, $postLog);

      if ($result['success']) {
        DB::commit();
      } else {
        DB::rollBack();
      }

      return $result;
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Post publication failed -----> rollback', [
        'post_log_id' => $postLog->id,
        'platform' => $postLog->platform,
        'publication_id' => $postLog->publication_id,
        'error' => $e->getMessage()
      ]);

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
      'twitter', 'x' => new TwitterService($socialAccount->access_token, $socialAccount),
      default => throw new \Exception("Unsupported platform: {$socialAccount->platform}"),
    };
  }
  /**
   * Unpublish from specific platforms
   */
  public function unpublishFromPlatforms(Publication $publication, array $accountIds): array
  {
    // Include published AND failed posts, filtered by account
    $logs = SocialPostLog::where('publication_id', $publication->id)
      ->whereIn('social_account_id', $accountIds)
      ->whereIn('status', ['published', 'failed'])
      ->get();

    $results = [];
    $allSuccess = true;

    if ($logs->isEmpty()) {
      return ['success' => true, 'message' => 'No active posts found for selected accounts', 'results' => []];
    }

    foreach ($logs as $log) {
      try {
        $socialAccount = $log->socialAccount;

        if (!$socialAccount) {
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
            $deleted = $platformService->deletePost($log->platform_post_id);

            if ($deleted) {
              $log->update(['status' => 'deleted']);
              $results[] = ['log_id' => $log->id, 'platform' => $log->platform, 'status' => 'deleted'];

              // Notify User (Video Deleted) - Optional for other types?
              if ($log->platform === 'youtube') {
                $publication->user->notify(new VideoDeletedNotification($log));
              }
            } else {
              // Post not found on platform - mark as deleted
              $log->update(['status' => 'deleted']);
              $results[] = [
                'log_id' => $log->id,
                'platform' => $log->platform,
                'status' => 'deleted',
                'note' => 'Post not found on platform'
              ];
            }
          } catch (\Exception $deleteError) {
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
   * Unpublish from all social platforms
   */
  public function unpublishFromAllPlatforms(Publication $publication): array
  {
    // Include published AND failed posts
    $logs = SocialPostLog::where('publication_id', $publication->id)
      ->whereIn('status', ['published', 'failed'])
      ->get();

    $results = [];
    $allSuccess = true;

    // If no logs published, consider success (nothing to delete)
    if ($logs->isEmpty()) {
      return ['success' => true, 'message' => 'No active posts found', 'results' => []];
    }

    foreach ($logs as $log) {
      try {
        $socialAccount = $log->socialAccount;

        if (!$socialAccount) {
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
            // Try to delete
            $deleted = $platformService->deletePost($log->platform_post_id);

            if ($deleted) {
              $log->update(['status' => 'deleted']);
              // Notify User
              $publication->user->notify(new VideoDeletedNotification($log));
              $results[] = ['log_id' => $log->id, 'platform' => $log->platform, 'status' => 'deleted'];
            } else {
              // Post not found on platform - mark as deleted
              $log->update(['status' => 'deleted']);
              $results[] = [
                'log_id' => $log->id,
                'platform' => $log->platform,
                'status' => 'deleted',
                'note' => 'Post not found on platform'
              ];
            }
          } catch (\Exception $deleteError) {
            // If the error is "not found" or 404, mark as deleted
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
              // Real error - report but do not fail everything
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
          // Log marked as posted but without ID - mark as deleted
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
