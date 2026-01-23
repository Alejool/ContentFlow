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

class PublishToSocialMedia implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public $timeout = 600;
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
      foreach ($platformResults as $platform => $pResult) {
        $publisher = \App\Models\User::find($this->publication->published_by);
        if ($pResult['success']) {
          $this->publication->logActivity('published_on_platform', [
            'platform' => $platform,
            'log_id' => $pResult['logs'][0]->id ?? null,
          ], $publisher);
        } else {
          $this->publication->logActivity('failed_on_platform', [
            'platform' => $platform,
            'error' => $pResult['errors'][0]['message'] ?? 'Unknown error',
          ], $publisher);
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
      }
    } catch (\Throwable $e) {

      Log::info('Publishing job crashed', [
        'publication_id' => $this->publication->id,
        'error' => $e->getMessage(),
      ]);

      $this->publication->update([
        'status' => 'failed',
      ]);
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
