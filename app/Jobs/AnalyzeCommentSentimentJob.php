<?php

namespace App\Jobs;

use App\Models\Social\SocialPostLog;
use App\Services\SentimentAnalysisService;
use App\Services\SocialTokenManager;
use App\Services\SocialPlatforms\SocialPlatformFactory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AnalyzeCommentSentimentJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public $tries = 3;
  public $timeout = 300; // 5 minutes
  public $backoff = [60, 120, 300]; // Retry after 1, 2, 5 minutes

  /**
   * Create a new job instance.
   */
  public function __construct(
    public SocialPostLog $postLog,
    public int $commentLimit = 100
  ) {}

  /**
   * Execute the job.
   */
  public function handle(
    SentimentAnalysisService $sentimentService,
    SocialTokenManager $tokenManager
  ): void {
    Log::info('Starting comment sentiment analysis', [
      'post_log_id' => $this->postLog->id,
      'platform' => $this->postLog->platform,
      'platform_post_id' => $this->postLog->platform_post_id
    ]);

    // Validate post has required data
    if (!$this->postLog->platform_post_id || !$this->postLog->socialAccount) {
      Log::warning('Cannot analyze comments: missing platform_post_id or social account', [
        'post_log_id' => $this->postLog->id
      ]);
      return;
    }

    try {
      // Step 1: Get valid token for the social account
      $token = $tokenManager->getValidToken($this->postLog->socialAccount);

      // Step 2: Get platform service
      $platformService = SocialPlatformFactory::make(
        $this->postLog->platform,
        $token
      );

      // Step 3: Fetch comments from platform
      $rawComments = $platformService->getPostComments(
        $this->postLog->platform_post_id,
        $this->commentLimit
      );

      if (empty($rawComments)) {
        Log::info('No comments found for post', [
          'post_log_id' => $this->postLog->id
        ]);

        // Update with empty data
        $this->postLog->updateCommentSentimentData([], [
          'total' => 0,
          'positive' => 0,
          'inquiry' => 0,
          'hate_speech' => 0,
          'last_synced_at' => now()->toIso8601String()
        ]);

        return;
      }

      Log::info('Fetched comments from platform', [
        'post_log_id' => $this->postLog->id,
        'comment_count' => count($rawComments)
      ]);

      // Step 4: Analyze sentiment for each comment
      $analyzedComments = [];
      $stats = [
        'total' => 0,
        'positive' => 0,
        'inquiry' => 0,
        'hate_speech' => 0,
        'unknown' => 0
      ];

      foreach ($rawComments as $comment) {
        $text = $comment['text'] ?? '';

        if (empty(trim($text))) {
          continue;
        }

        // Analyze sentiment
        $sentiment = $sentimentService->analyzeSentiment($text);

        // Build analyzed comment structure
        $analyzedComment = [
          'id' => $comment['id'] ?? uniqid(),
          'author' => $comment['author'] ?? 'Unknown',
          'text' => $text,
          'sentiment' => $sentiment['sentiment'],
          'confidence' => $sentiment['confidence'],
          'created_at' => $comment['created_at'] ?? now()->toIso8601String(),
          'analyzed_at' => now()->toIso8601String()
        ];

        $analyzedComments[] = $analyzedComment;

        // Update statistics
        $stats['total']++;
        $sentimentType = $sentiment['sentiment'];
        if (isset($stats[$sentimentType])) {
          $stats[$sentimentType]++;
        } else {
          $stats['unknown']++;
        }

        // Small delay to avoid rate limiting
        if (count($analyzedComments) % 10 === 0) {
          usleep(500000); // 0.5 seconds
        }
      }

      // Step 5: Update post log with analyzed comments
      $summary = [
        'total' => $stats['total'],
        'positive' => $stats['positive'],
        'inquiry' => $stats['inquiry'],
        'hate_speech' => $stats['hate_speech'],
        'last_synced_at' => now()->toIso8601String()
      ];

      $this->postLog->updateCommentSentimentData($analyzedComments, $summary);

      Log::info('Comment sentiment analysis completed', [
        'post_log_id' => $this->postLog->id,
        'total_comments' => $stats['total'],
        'positive' => $stats['positive'],
        'inquiry' => $stats['inquiry'],
        'hate_speech' => $stats['hate_speech']
      ]);
    } catch (\Exception $e) {
      Log::error('Comment sentiment analysis failed', [
        'post_log_id' => $this->postLog->id,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);

      // Re-throw to trigger retry
      throw $e;
    }
  }

  /**
   * Handle a job failure.
   */
  public function failed(\Throwable $exception): void
  {
    Log::error('Comment sentiment analysis job failed permanently', [
      'post_log_id' => $this->postLog->id,
      'error' => $exception->getMessage()
    ]);
  }
}
