<?php

namespace App\Actions\Publications;

use App\Models\Publications\Publication;
use App\Services\Media\MediaProcessingService;
use Illuminate\Support\Facades\DB;

class DeletePublicationAction
{
  public function __construct(
    protected MediaProcessingService $mediaService
  ) {}

  public function execute(Publication $publication): bool
  {
    return DB::transaction(function () use ($publication) {
      // 1. Delete associated media files (physical and database)
      $publication->mediaFiles()->get()->each(function ($mediaFile) {
        $this->mediaService->deleteMediaFile($mediaFile);
      });

      // 2. Delete the publication itself
      // Note: scheduled_posts and campaign_publication will be deleted via DB cascade (onDelete('cascade'))
      // Note: social_post_logs will be set to NULL via DB cascade (onDelete('set null'))
      return $publication->delete();
    });
  }
}
