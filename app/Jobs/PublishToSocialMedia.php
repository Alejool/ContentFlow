<?php

namespace App\Jobs;

use App\Models\Publications\Publication;
use App\Services\Publish\PlatformPublishService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Events\PublicationStatusUpdated;

use App\Models\User;

class PublishToSocialMedia implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public $timeout = 1200;
  public $tries = 1;
  public $backoff = 15;

  public function __construct(
    private Publication $publication,
    private $socialAccounts
  ) {}

  public function handle(PlatformPublishService $publishService): void
  {
    Log::info('Starting background publishing', [
      'publication' => $this->publication
    ]);

    try {
      $result = $publishService->publishToAllPlatforms(
        $this->publication,
        $this->socialAccounts
      );

      $platformResults = $result['platform_results'] ?? [];
      $publisher = User::find($this->publication->published_by);

      // If no platforms in results, it might be an initialization failure
      if (empty($platformResults)) {
        foreach ($this->socialAccounts as $account) {
          $this->publication->logActivity('failed_on_platform', [
            'platform' => $account->platform,
            'error' => $result['message'] ?? 'Platform initialization failed',
          ], $publisher);
        }
      } else {
        foreach ($platformResults as $platform => $pResult) {
          if ($pResult['success']) {
            $this->publication->logActivity('published_on_platform', [
              'platform' => $platform,
              'log_id' => $pResult['logs'][0]->id ?? null,
            ], $publisher);
          } else {
            $this->publication->logActivity('failed_on_platform', [
              'platform' => $platform,
              'error' => $pResult['errors'][0]['message'] ?? 'Unknown platform error',
            ], $publisher);
          }
        }
      }

      $anySuccess = collect($platformResults)
        ->contains(fn($r) => !empty($r['success']));

      if ($anySuccess) {
        $this->publication->update([
          'status' => 'published',
          'publish_date' => now(),
        ]);
      } else {
        $this->publication->update([
          'status' => 'failed',
        ]);

        $this->publication->logActivity('publication_failed', [
          'reason' => empty($platformResults) ? ($result['message'] ?? 'Initialization failed') : 'All platforms failed',
          'results' => $platformResults
        ], $publisher);
      }
    } catch (\Throwable $e) {

      Log::error('Publishing job crashed', [
        'publication_id' => $this->publication->id,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
      ]);

      $publisher = User::find($this->publication->published_by);
      foreach ($this->socialAccounts as $account) {
        $this->publication->logActivity('failed_on_platform', [
          'platform' => $account->platform,
          'error' => $e->getMessage(),
          'note' => 'Job crashed'
        ], $publisher);
      }

      $this->publication->update([
        'status' => 'failed',
      ]);

      $this->publication->logActivity('publication_failed', [
        'reason' => 'Job crashed',
        'error' => $e->getMessage()
      ], $publisher);
    }

    // Notify owner
    event(new PublicationStatusUpdated(
      userId: $this->publication->user_id,
      publicationId: $this->publication->id,
      status: $this->publication->status
    ));

    // Also notify publisher if different from owner
    if ($this->publication->published_by && $this->publication->published_by !== $this->publication->user_id) {
      event(new PublicationStatusUpdated(
        userId: $this->publication->published_by,
        publicationId: $this->publication->id,
        status: $this->publication->status
      ));
    }
  }
}
