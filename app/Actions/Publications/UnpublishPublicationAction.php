<?php

namespace App\Actions\Publications;

use App\Models\Publications\Publication;
use App\Services\Publish\PlatformPublishService;
use App\Events\Publications\PublicationUpdated;
class UnpublishPublicationAction
{
  public function __construct(
    protected PlatformPublishService $publishService
  ) {}

  public function execute(Publication $publication, ?array $platformIds = null): array
  {
    if (!empty($platformIds)) {
      $result = $this->publishService->unpublishFromPlatforms($publication, $platformIds);
    } else {
      $result = $this->publishService->unpublishFromAllPlatforms($publication);
    }

    if ($result['success']) {
      // Recargar la relación para obtener los datos más recientes
      $publication->load('socialPostLogs');
      
      // Usar el servicio de estado para determinar el nuevo estado
      $statusService = app(\App\Services\Publications\PublicationStatusService::class);
      $statusService->updatePublicationStatus($publication, true);
      
      \Log::info('UnpublishPublicationAction: Status updated after unpublish', [
        'publication_id' => $publication->id,
        'new_status' => $publication->status,
        'status_summary' => $publication->publication_status_summary
      ]);
      
      // Si el estado es draft, eliminar publicaciones recurrentes programadas
      if ($publication->status === 'draft') {
        $deletedRecurringPosts = $publication->scheduled_posts()
          ->where('status', 'pending')
          ->where('is_recurring_instance', true)
          ->delete();
        
        if ($deletedRecurringPosts > 0) {
          \Log::info('UnpublishPublicationAction: Deleted recurring scheduled posts', [
            'publication_id' => $publication->id,
            'deleted_count' => $deletedRecurringPosts
          ]);
        }
      }

      event(new PublicationUpdated($publication));
    }

    return $result;
  }
}
