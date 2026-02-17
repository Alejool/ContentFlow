<?php

namespace App\Console\Commands;

use App\Models\Social\ScheduledPost;
use App\Jobs\ProcessScheduledPublicationJob;
use App\Jobs\PublishToSocialMedia;
use App\Notifications\PublicationProcessingStartedNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessScheduledPosts extends Command
{
  protected $signature = 'social:process-scheduled';
  protected $description = 'Procesa las publicaciones programadas que deben ser enviadas';

  public function handle()
  {
    $now = now();
    $posts = ScheduledPost::where('status', 'pending')
      ->where('scheduled_at', '<=', $now)
      ->with(['publication', 'socialAccount'])
      ->get();

    if ($posts->isEmpty()) {
      Log::debug("No hay publicaciones programadas pendientes para procesar a las {$now}.");
      $this->info("No hay publicaciones programadas para procesar.");
      return;
    }

    Log::info("Se encontraron {$posts->count()} publicaciones programadas para procesar.");

    // Agrupar por publicación para enviar un solo Job con todas sus cuentas
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

      Log::info("Procesando publicación ID {$publicationId} con {$socialAccounts->count()} plataformas.");

      try {
        // Update publication status
        $publication->update(['status' => 'publishing']);
        $publication->logActivity('publishing');

        // Broadcast status update
        event(new \App\Events\PublicationStatusUpdated(
          userId: $publication->user_id,
          publicationId: $publication->id,
          status: 'publishing'
        ));

        // Notify user
        try {
          $accountsData = $socialAccounts->map(fn($acc) => [
            'platform' => $acc->platform,
            'account_name' => $acc->account_name
          ])->toArray();
          
          $notification = new PublicationProcessingStartedNotification($publication, $accountsData);
          $publication->user->notify($notification);
          
          if ($publication->workspace) {
            $publication->workspace->notify($notification);
          }
        } catch (\Exception $e) {
          Log::error("Failed to send processing notification", [
            'publication_id' => $publication->id,
            'error' => $e->getMessage()
          ]);
        }

        // Try to dispatch to queue, fallback to sync if queue fails
        try {
          PublishToSocialMedia::dispatch(
            $publication->id,
            $socialAccounts->pluck('id')->toArray()
          )->onQueue('publishing');
          
          ScheduledPost::whereIn('id', $scheduledPosts->pluck('id'))
            ->update(['status' => 'posted']);
            
          $this->info("Publicación ID {$publicationId} enviada a cola.");
        } catch (\Exception $e) {
          Log::warning("Queue not available, processing synchronously", [
            'publication_id' => $publicationId,
            'error' => $e->getMessage()
          ]);
          
          // Process synchronously if queue fails
          PublishToSocialMedia::dispatchSync(
            $publication->id,
            $socialAccounts->pluck('id')->toArray()
          );
          
          ScheduledPost::whereIn('id', $scheduledPosts->pluck('id'))
            ->update(['status' => 'posted']);
            
          $this->info("Publicación ID {$publicationId} procesada síncronamente.");
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

    Log::info("Finalizado procesamiento de {$posts->count()} posts programados.");
    $this->info("{$posts->count()} posts programados procesados.");
  }
}
