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
use App\Services\SocialPlatforms\TwitterService;
use App\Notifications\VideoUploadedNotification;
use App\Notifications\VideoDeletedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;
use App\Models\YouTubePlaylistQueue;
use App\Notifications\PublicationPostFailedNotification;
use App\Jobs\VerifyYouTubeVideoStatus;

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
   * Publish to platform (only first video)
   */
  public function publishToPlatform(
    Publication $publication,
    SocialAccount $socialAccount,
    $platformService,
    SocialPostLog $postLog
  ): array {
    $firstMediaFile = $publication->mediaFiles->first();

    if (!$firstMediaFile) {
      $this->logService->markAsFailed($postLog, 'No media files found');
      return [
        'success' => false,
        'error' => 'No media files found',
        'log' => $postLog,
      ];
    }

    $uploadedPostId = null;
    try {
      // Step 1: Upload video to YouTube
      $videoAbsolutePath = $this->resolveFilePath($firstMediaFile->file_path);

      $postData = [
        'video_path' => $videoAbsolutePath,
        'title' => $publication->title,
        'content' => $this->buildDescription($publication),
        'tags' => $this->extractHashtags($publication->hashtags),
        'privacy' => 'public',
        'type' => $firstMediaFile->youtube_type ?? 'regular',
        'platform_settings' => $postLog->platform_settings ?? $publication->platform_settings,
      ];

      // Search for Thumbnail Derivatives
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
      Log::info('Uploading data 1------', ['postData' => $postData]);

      $response = $platformService->publishPost($postData);
      $uploadedPostId = $response['post_id'] ?? $response['id'] ?? null;

      // Step 2: Mark as published IMMEDIATELY after upload
      $postLog = $this->logService->markAsPublished($postLog, $response);

      // Verify the final status on YouTube after a few minutes (e.g., copyright, processing errors)
      VerifyYouTubeVideoStatus::dispatch($postLog)->delay(now()->addMinutes(5));

      // Notify User
      $publication->user->notify(new VideoUploadedNotification($postLog));

      Log::info('YouTube video uploaded successfully', [
        'video_id' => $uploadedPostId,
        'publication_id' => $publication->id
      ]);
    } catch (\Throwable $e) {
      // Only mark as failed if the VIDEO UPLOAD failed
      Log::error('YouTube video upload failed', [
        'publication_id' => $publication->id,
        'error' => $e->getMessage()
      ]);
      $this->logService->markAsFailed($postLog, $e->getMessage());


      return [
        'success' => false,
        'log' => $postLog->fresh(),
        'error' => $e->getMessage(),
      ];
    }

    // Step 3: Handle playlist AFTER the video is published
    // If it fails, it does NOT affect the video's state
    $campaignGroup = $publication->campaigns->first();

    if ($campaignGroup && $uploadedPostId) {
      try {
        // Create entry in the playlist queue for background processing
        YouTubePlaylistQueue::create([
          'social_post_log_id' => $postLog->id,
          'campaign_id' => $campaignGroup->id,
          'video_id' => $uploadedPostId,
          'playlist_id' => $campaignGroup->youtube_playlist_id,
          'playlist_name' => $campaignGroup->name,
          'status' => 'pending',
        ]);

        Log::info('Playlist operation queued for background processing', [
          'video_id' => $uploadedPostId,
          'campaign' => $campaignGroup->name
        ]);
      } catch (\Exception $e) {
        // Log the error but DO NOT fail the publication
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

    // Return success because the video was uploaded successfully
    return [
      'success' => true,
      'log' => $postLog,
      'error' => null,
    ];
  }

  /**
   * Publish to other platforms (multiple files)
   */
  public function publishToOtherPlatform(
    Publication $publication,
    SocialAccount $socialAccount,
    $mediaFile,
    $platformService,
    SocialPostLog $postLog
  ): array {
    try {
      $postData = [
        'video_path' => $mediaFile->file_path,
        'caption' => $this->buildCaption($publication),
        'title' => $publication->title,
        'description' => $publication->description,
        'hashtags' => $publication->hashtags,
        'platform_settings' => $postLog->platform_settings ?? $publication->platform_settings,
      ];


      Log::info('DEBUG DATA BEFORE FACEBOOK CALL', [
        'keys' => array_keys($postData),
        'content' => $postData['content'] ?? 'N/A',
        'caption' => $postData['caption'] ?? 'N/A',
        'platform' => $socialAccount->platform
      ]);

      $response = $platformService->publishPost($postData);

      // Mark as published
      $postLog = $this->logService->markAsPublished($postLog, $response);

      // Notify User
      $publication->user->notify(new VideoUploadedNotification($postLog));

      return [
        'success' => true,
        'log' => $postLog,
        'error' => null,
      ];
    } catch (\Throwable $e) {
      // Mark as failed
      Log::error('esta ffaladno envio ', [
        'post_log_id' => $postLog->id,
        'platform' => $postLog->platform,
        'publication_id' => $postLog->publication_id,
        'error' => $e->getMessage()
      ]);
      Log::error('Post publication failed', [
        'post_log_id' => $postLog->id,
        'platform' => $postLog->platform,
        'publication_id' => $postLog->publication_id,
        'error' => $e->getMessage()
      ]);
      $this->logService->markAsFailed($postLog, $e->getMessage());

      return [
        'success' => false,
        'log' => $postLog->fresh(),
        'error' => $e->getMessage(),
      ];
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
    $preparedLogsMap = $this->initializeLogs($publication, $socialAccounts);

    foreach ($socialAccounts as $socialAccount) {
      $platformLogs = [];
      $platformErrors = [];

      // Retrieve pre-created logs
      if (!isset($preparedLogsMap[$socialAccount->id])) {
        $msg = 'Failed to initialize logs for platform: ' . $socialAccount->platform;
        $allErrors[$socialAccount->platform] = [['message' => $msg]];
        Log::error($msg);
        continue;
      }

      $pendingLogs = $preparedLogsMap[$socialAccount->id];

      Log::info('Starting transaction for platform', ['platform' => $socialAccount->platform, 'pending_count' => count($pendingLogs)]);
      DB::beginTransaction();

      try {
        $platformService = $this->getPlatformService($socialAccount);

        foreach ($pendingLogs as $item) {
          $postLog = $item['log'];
          Log::info('Processing log inside transaction', ['log_id' => $postLog->id]);

          $result = null;

          if ($item['type'] === 'youtube') {
            $result = $this->publishToPlatform($publication, $socialAccount, $platformService, $postLog);
          } else {
            $result = $this->publishToOtherPlatform(
              $publication,
              $socialAccount,
              $item['media'],
              $platformService,
              $postLog
            );
          }

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


        // Mark all pending logs as failed since the transaction rolled back their 'success' state
        // (but presumably they were created before transaction, so they exist)
        foreach ($pendingLogs as $item) {
          $this->logService->markAsFailed($item['log'], $e->getMessage());
        }

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

  private function retryYouTubePublication($postLog, $publication, $platformService): array
  {
    try {
      $mediaFile = $postLog->mediaFile ?? $publication->mediaFiles->first();

      $postData = [
        'video_path' => $mediaFile->file_path,
        'title' => $publication->title,
        'content' => $this->buildDescription($publication),
        'tags' => $this->extractHashtags($publication->hashtags),
        'privacy' => 'public',
      ];

      Log::info('Uploading data 3------', ['postData' => $postData]);

      $response = $platformService->publishPost($postData);

      $this->logService->markAsPublished($postLog, $response);

      // Notify User
      $publication->user->notify(new VideoUploadedNotification($postLog));

      return [
        'success' => true,
        'log' => $postLog->fresh(),
      ];
    } catch (\Exception $e) {
      Log::error('Post publication failed -----> retry----3', [
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

  private function retryOtherPlatformPublication($postLog, $publication, $platformService): array
  {
    try {
      $mediaFile = $postLog->mediaFile;

      if (!$mediaFile) {
        throw new \Exception('Media file not found');
      }

      $postData = [
        'video_path' => $mediaFile->file_path,
        'caption' => $this->buildCaption($publication),
        'title' => $publication->title,
        'description' => $publication->description,
        'hashtags' => $publication->hashtags,
      ];

      Log::info('Uploading data 2------', ['postData' => $postData]);

      $response = $platformService->publishPost($postData);

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
