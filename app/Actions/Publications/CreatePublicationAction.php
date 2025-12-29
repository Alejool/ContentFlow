<?php

namespace App\Actions\Publications;

use App\Models\Campaign;
use App\Models\Publications\Publication;
use App\Services\Media\MediaProcessingService;
use App\Services\Scheduling\SchedulingService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreatePublicationAction
{
  public function __construct(
    protected MediaProcessingService $mediaService,
    protected SchedulingService $schedulingService
  ) {
  }

  public function execute(array $data, array $files = []): Publication
  {
    return DB::transaction(function () use ($data, $files) {
      $publication = Publication::create([
        'title' => $data['title'],
        'description' => $data['description'],
        'hashtags' => $data['hashtags'] ?? '',
        'goal' => $data['goal'] ?? '',
        'slug' => Str::slug($data['title']),
        'user_id' => Auth::id(),
        'workspace_id' => Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id,
        'start_date' => $data['start_date'] ?? null,
        'end_date' => $data['end_date'] ?? null,
        'status' => $data['status'] ?? 'draft',
        'publish_date' => ($data['status'] ?? 'draft') === 'published' ? now() : null,
        'scheduled_at' => $data['scheduled_at'] ?? null,
        'platform_settings' => is_string($data['platform_settings'] ?? null)
          ? json_decode($data['platform_settings'], true)
          : ($data['platform_settings'] ?? Auth::user()->global_platform_settings),
      ]);

      if (isset($data['campaign_id'])) {
        $publication->campaigns()->attach($data['campaign_id']);
      }

      if (!empty($files)) {
        $this->mediaService->processUploads($publication, $files, [
          'youtube_types' => $data['youtube_types'] ?? [],
          'durations' => $data['durations'] ?? [],
          'thumbnails' => $data['thumbnails'] ?? [],
        ]);
      }

      if (!empty($data['social_accounts'])) {
        $this->schedulingService->scheduleForAccounts(
          $publication,
          $data['social_accounts'],
          $data['social_account_schedules'] ?? []
        );
      }

      return $publication;
    });
  }
}
