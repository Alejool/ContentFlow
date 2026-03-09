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
      $remaining = $publication->socialPostLogs()
        ->where('status', 'published')
        ->count();

      if ($remaining === 0) {
        $publication->update(['status' => 'draft']);
        
        // Eliminar automáticamente las publicaciones recurrentes programadas
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
