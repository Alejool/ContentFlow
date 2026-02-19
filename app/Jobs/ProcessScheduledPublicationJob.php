<?php

namespace App\Jobs;

use App\Models\Social\ScheduledPost;
use App\Models\Publications\Publication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessScheduledPublicationJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public $timeout = 300;
  public $tries = 1;

  public function __construct(
    private int $publicationId,
    private array $scheduledPostIds
  ) {}

  public function handle(): void
  {
    $publication = Publication::find($this->publicationId);
    
    if (!$publication) {
      Log::error("Publication not found for scheduled processing", ['id' => $this->publicationId]);
      ScheduledPost::whereIn('id', $this->scheduledPostIds)->update(['status' => 'failed']);
      return;
    }

    $scheduledPosts = ScheduledPost::whereIn('id', $this->scheduledPostIds)
      ->with('socialAccount')
      ->get();

    $socialAccounts = $scheduledPosts->pluck('socialAccount')->filter();

    if ($socialAccounts->isEmpty()) {
      Log::warning("No active social accounts for scheduled publication", [
        'publication_id' => $this->publicationId
      ]);
      
      ScheduledPost::whereIn('id', $this->scheduledPostIds)
        ->update(['status' => 'failed']);
      
      $publication->update(['status' => 'failed']);
      return;
    }

    // Update publication status
    $publication->update(['status' => 'publishing']);
    $publication->logActivity('publishing');

    // Broadcast status update
    event(new \App\Events\PublicationStatusUpdated(
      userId: $publication->user_id,
      publicationId: $publication->id,
      status: 'publishing'
    ));

    // NOTE: No notification sent here - will be sent by PublishToSocialMedia job at the end

    // Dispatch publishing job
    PublishToSocialMedia::dispatch(
      $publication->id,
      $socialAccounts->pluck('id')->toArray()
    )->onQueue('publishing');

    // Mark scheduled posts as posted
    ScheduledPost::whereIn('id', $this->scheduledPostIds)
      ->update(['status' => 'posted']);

    Log::info("Scheduled publication dispatched", [
      'publication_id' => $publication->id,
      'platforms' => $socialAccounts->count()
    ]);
  }
  
  public function failed(\Throwable $exception): void
  {
    Log::error('ProcessScheduledPublicationJob failed permanently', [
      'publication_id' => $this->publicationId,
      'error' => $exception->getMessage()
    ]);

    ScheduledPost::whereIn('id', $this->scheduledPostIds)
      ->update(['status' => 'failed']);

    $publication = Publication::find($this->publicationId);
    if ($publication) {
      $publication->update(['status' => 'failed']);
      
      // ONLY send notification here after job completely failed
      try {
        $notification = new \App\Notifications\PublicationPostFailedNotification(
          $publication,
          'Scheduled processing failed: ' . $exception->getMessage(),
          []
        );
        
        $publication->user->notify($notification);
        
        if ($publication->workspace && ($publication->workspace->discord_webhook_url || $publication->workspace->slack_webhook_url)) {
          $publication->workspace->notify($notification);
        }
      } catch (\Exception $e) {
        Log::error('Failed to send failure notification', [
          'publication_id' => $publication->id,
          'error' => $e->getMessage()
        ]);
      }
    }
  }
}
