<?php

namespace App\Console\Commands\Publication;

use App\Models\Social\ScheduledPost;
use App\Jobs\Publication\ProcessScheduledPublicationJob;
use App\Jobs\Social\PublishToSocialMedia;
use App\Notifications\Publication\PublicationProcessingStartedNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessScheduledPosts extends Command
{
  protected $signature = 'social:process-scheduled';
  protected $description = 'Procesa las publicaciones programadas que deben ser enviadas';

  /**
   * Maximum look-ahead window. Posts scheduled within this many minutes
   * will be dispatched early so the upload finishes BY the target time.
   */
  private const MAX_LEAD_MINUTES = 30;

  public function handle()
  {
    $now = now();

    // Look ahead up to MAX_LEAD_MINUTES so we can pre-dispatch large-file uploads.
    $posts = ScheduledPost::where('status', 'pending')
      ->where('scheduled_at', '<=', $now->copy()->addMinutes(self::MAX_LEAD_MINUTES))
      ->with(['publication.mediaFiles', 'socialAccount'])
      ->get();

    if ($posts->isEmpty()) {
      Log::debug("No hay publicaciones programadas pendientes para procesar a las {$now}.");
      $this->info("No hay publicaciones programadas para procesar.");
      return;
    }

    Log::info("Se encontraron {$posts->count()} publicaciones en ventana de procesamiento.");

    $groupedByPublication = $posts->groupBy('publication_id');

    foreach ($groupedByPublication as $publicationId => $scheduledPosts) {
      $publication = $scheduledPosts->first()->publication;

      if (!$publication) {
        Log::error("Publicación no encontrada para ID: {$publicationId}. Saltando.");
        ScheduledPost::whereIn('id', $scheduledPosts->pluck('id'))
          ->update(['status' => 'failed']);
        continue;
      }

      $socialAccounts = $scheduledPosts->pluck('socialAccount')->filter();

      if ($socialAccounts->isEmpty()) {
        Log::warning("No se encontraron cuentas activas para la publicación ID: {$publicationId}.");
        ScheduledPost::whereIn('id', $scheduledPosts->pluck('id'))
          ->update(['status' => 'failed']);
        $publication->update(['status' => 'failed']);
        continue;
      }

      // Determine when to dispatch based on estimated upload time.
      $leadMinutes = $this->estimateLeadMinutes($publication, $socialAccounts->count());
      $scheduledAt = $scheduledPosts->first()->scheduled_at;
      $dispatchAt = $scheduledAt->copy()->subMinutes($leadMinutes);

      if ($dispatchAt->gt($now)) {
        // Not time to dispatch yet — will check again next minute.
        Log::debug("Publicación {$publicationId} aún no lista para despachar.", [
          'scheduled_at' => $scheduledAt,
          'dispatch_at' => $dispatchAt,
          'lead_minutes' => $leadMinutes,
        ]);
        continue;
      }

      Log::info("Procesando publicación ID {$publicationId} con {$socialAccounts->count()} plataformas.", [
        'lead_minutes' => $leadMinutes,
        'scheduled_at' => $scheduledAt,
        'dispatching_at' => $now,
      ]);

      try {
        // targetPublishAt is passed only when the scheduled time is still in the future.
        // The job will sleep until that moment before calling the social platform API,
        // so the upload finishes BY the scheduled time.
        $targetPublishAt = $scheduledAt->isFuture() ? $scheduledAt : null;

        try {
          PublishToSocialMedia::dispatch(
            $publication->id,
            $socialAccounts->pluck('id')->toArray(),
            $targetPublishAt
          )->onQueue('publishing');

          ScheduledPost::whereIn('id', $scheduledPosts->pluck('id'))
            ->update(['status' => 'posted']);

          $this->info("Publicación ID {$publicationId} enviada a cola.");
        } catch (\Exception $e) {
          Log::warning("Cola no disponible, procesando síncronamente", [
            'publication_id' => $publicationId,
            'error' => $e->getMessage()
          ]);

          PublishToSocialMedia::dispatchSync(
            $publication->id,
            $socialAccounts->pluck('id')->toArray()
          );

          ScheduledPost::whereIn('id', $scheduledPosts->pluck('id'))
            ->update(['status' => 'posted']);

          $this->info("Publicación ID {$publicationId} procesada síncronamente.");
        }

        // Notify user only for immediate dispatches (not pre-dispatches for future posts)
        // so the user isn't confused by a "processing" notification before the target time.
        if (!$targetPublishAt) {
          try {
            $accountsData = $socialAccounts->map(fn($acc) => [
              'platform' => $acc->platform,
              'account_name' => $acc->account_name
            ])->toArray();

            $notification = new PublicationProcessingStartedNotification($publication, $accountsData);
            $publication->user->notify($notification);

            if ($publication->workspace && ($publication->workspace->discord_webhook_url || $publication->workspace->slack_webhook_url)) {
              $publication->workspace->notify($notification);
            }
          } catch (\Exception $e) {
            Log::error("Failed to send processing notification", [
              'publication_id' => $publication->id,
              'error' => $e->getMessage()
            ]);
          }
        }
      } catch (\Exception $e) {
        Log::error("Error procesando publicación {$publicationId}", [
          'error' => $e->getMessage()
        ]);

        ScheduledPost::whereIn('id', $scheduledPosts->pluck('id'))
          ->update(['status' => 'failed']);
        $publication->update(['status' => 'failed']);

        $this->error("Error en publicación ID {$publicationId}: {$e->getMessage()}");
      }
    }

    Log::info("Finalizado procesamiento de ventana programada.");
    $this->info("{$posts->count()} posts en ventana procesados.");
  }

  /**
   * Estimate how many minutes before scheduled_at the job should start,
   * so the upload finishes BY the target time.
   *
   * Based on file size and platform count. All values are conservative
   * upper bounds — better to publish 30s early than 5 min late.
   */
  private function estimateLeadMinutes($publication, int $platformCount): int
  {
    $videoFile = $publication->mediaFiles
      ->firstWhere('file_type', 'video');

    if (!$videoFile) {
      // Image / text posts are fast to upload.
      return 3;
    }

    $sizeMb = (float) (($videoFile->size ?? 0) / (1024 * 1024));

    $base = match (true) {
      $sizeMb > 500 => 20,
      $sizeMb > 200 => 15,
      $sizeMb > 100 => 10,
      $sizeMb > 50  => 7,
      default       => 5,
    };

    // Each extra platform adds ~2 min (parallel uploads but same bandwidth).
    $extra = max(0, $platformCount - 1) * 2;

    return min($base + $extra, self::MAX_LEAD_MINUTES);
  }
}
