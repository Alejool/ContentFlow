<?php

namespace App\Actions\Publications;

use App\Models\Publications\Publication;
use App\Services\Publish\PlatformPublishService;

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
      }
    }

    return $result;
  }
}
