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
      'publication_id' => $this->publication->id
    ]);

    try {
      $result = $publishService->publishToAllPlatforms(
        $this->publication,
        $this->socialAccounts
      );

      $anySuccess = collect($result['platform_results'] ?? [])
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

      $this->publication->update([
        'status' => 'failed',
      ]);

      Log::error('Publishing job crashed', [
        'publication_id' => $this->publication->id,
        'error' => $e->getMessage(),
      ]);
    }

    event(new PublicationStatusUpdated(
      userId: $this->publication->user_id,
      publicationId: $this->publication->id,
      status: $this->publication->status
    ));
  }
}
