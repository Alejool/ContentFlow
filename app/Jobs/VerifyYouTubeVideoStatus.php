<?php

namespace App\Jobs;

use App\Models\Social\SocialPostLog;
use App\Models\Publications\Publication;
use App\Services\SocialPlatforms\YouTubeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\PublicationStatusUpdate;

class VerifyYouTubeVideoStatus implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  protected $postLog;
  public $tries = 3;
  public $backoff = [300, 600, 1200]; // 5m, 10m, 20m

  public function __construct(SocialPostLog $postLog)
  {
    $this->postLog = $postLog;
  }

  public function handle()
  {
    $videoId = $this->postLog->platform_post_id;
    if (!$videoId) {
      Log::warning('VerifyYouTubeVideoStatus: No platform_post_id found for log', ['log_id' => $this->postLog->id]);
      return;
    }

    $socialAccount = $this->postLog->socialAccount;
    if (!$socialAccount) {
      Log::error('VerifyYouTubeVideoStatus: No social account associated with log', ['log_id' => $this->postLog->id]);
      return;
    }

    $youtubeService = new YouTubeService($socialAccount->access_token, $socialAccount);

    try {
      $statusData = $youtubeService->checkVideoStatus($videoId);
      Log::info('YouTube Video Status Check', ['log_id' => $this->postLog->id, 'status' => $statusData]);

      if (!$statusData['exists']) {
        $this->markAsFailed("Video disappeared or was deleted from YouTube.", 'deleted', $youtubeService);
        return;
      }

      $uploadStatus = $statusData['uploadStatus']; // 'processed', 'uploaded', 'rejected', 'failed'

      if ($uploadStatus === 'processed') {
        $this->markAsSuccess();
        return;
      }

      if ($uploadStatus === 'failed' || $uploadStatus === 'rejected') {
        $reason = $statusData['rejectionReason'] ?? 'Unknown rejection reason';
        $this->markAsFailed("YouTube rejected the video: {$reason}", $uploadStatus, $youtubeService);
        return;
      }

      // If still 'uploaded' but not processed, we wait for next retry
      if ($uploadStatus === 'uploaded') {
        Log::info('YouTube Video still processing...', ['video_id' => $videoId]);
        throw new \Exception("Video still processing on YouTube...");
      }
    } catch (\Exception $e) {
      Log::error('VerifyYouTubeVideoStatus error', ['error' => $e->getMessage()]);
      throw $e;
    }
  }

  protected function markAsSuccess()
  {
    $this->postLog->update([
      'status' => 'published',
      'published_at' => $this->postLog->published_at ?? now()
    ]);

    $publication = $this->postLog->publication;
    if ($publication && $publication->status !== 'published') {
      // Check if all other logs are in a terminal state
      $allLogs = $publication->socialPostLogs;
      $allFinished = $allLogs->every(fn($log) => in_array($log->status, ['published', 'failed', 'deleted', 'orphaned', 'removed_on_platform', 'rejected']));
      $anyPublished = $allLogs->contains(fn($log) => $log->status === 'published');

      if ($allFinished && $anyPublished) {
        $publication->update(['status' => 'published']);
      }
    }

    Log::info('YouTube Video verification success', ['log_id' => $this->postLog->id]);
  }

  protected function markAsFailed(string $message, string $specificStatus = 'failed', ?YouTubeService $youtubeService = null)
  {
    $this->postLog->update([
      'status' => $specificStatus === 'deleted' ? 'removed_on_platform' : 'failed',
      'error_message' => $message
    ]);

    $videoId = $this->postLog->platform_post_id;
    $deletionAttempted = false;
    $deletionSuccessful = false;

    // Attempt auto-deletion if it failed/rejected on YouTube to prevent duplicate references
    if ($youtubeService && $videoId && !in_array($specificStatus, ['deleted', 'removed_on_platform'])) {
      Log::info('Attempting auto-deletion of failed/rejected YouTube video', ['video_id' => $videoId]);
      $deletionAttempted = true;
      try {
        $deletionSuccessful = $youtubeService->deletePost($videoId);
        if ($deletionSuccessful) {
          Log::info('Auto-deletion successful', ['video_id' => $videoId]);
        } else {
          Log::warning('Auto-deletion returned false (already deleted or not found?)', ['video_id' => $videoId]);
        }
      } catch (\Exception $e) {
        Log::error('Auto-deletion failed', ['video_id' => $videoId, 'error' => $e->getMessage()]);
      }
    }

    $publication = $this->postLog->publication;
    if ($publication) {
      $publication->update(['status' => 'failed']);
    }

    Log::warning('YouTube Video verification failed', ['log_id' => $this->postLog->id, 'message' => $message]);

    // Notify user ALWAYS on failure/rejection/deletion
    if ($publication && $publication->user) {
      $finalMessage = $message;
      if ($deletionAttempted) {
        if ($deletionSuccessful) {
          $finalMessage .= " (Video eliminado automáticamente de YouTube para evitar duplicados).";
        } else {
          $finalMessage .= " (IMPORTANTE: No se pudo eliminar el video automáticamente. Por favor, elimínalo manualmente de YouTube antes de reintentar).";
        }
      }

      try {
        $publication->user->notify(new PublicationStatusUpdate($this->postLog, [
          'status' => $specificStatus,
          'message' => $finalMessage,
          'details' => [
            'platform_post_id' => $this->postLog->platform_post_id,
            'reason' => $specificStatus,
            'deletion_successful' => $deletionSuccessful,
            'deletion_attempted' => $deletionAttempted
          ]
        ]));
      } catch (\Exception $e) {
        Log::error('Failed to send YouTube failure notification', ['error' => $e->getMessage()]);
      }
    }
  }
}
