<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Publications\Publication;
use App\Models\ScheduledPost;
use Illuminate\Support\Facades\Auth;
use App\Models\SocialPostLog;
use App\Http\Requests\Publications\StorePublicationRequest;
use App\Http\Requests\Publications\UpdatePublicationRequest;
use App\Actions\Publications\CreatePublicationAction;
use App\Actions\Publications\UpdatePublicationAction;
use App\Actions\Publications\PublishPublicationAction;
use App\Actions\Publications\UnpublishPublicationAction;

class PublicationController extends Controller
{
  public function index(Request $request)
  {
    // Cache key based on workspace, filters, and page
    $cacheKey = sprintf(
      'publications:%d:%s:%d',
      Auth::user()->current_workspace_id,
      md5(json_encode($request->all())),
      $request->query('page', 1)
    );

    return cache()->remember($cacheKey, 10, function () use ($request) {
      // Optimized eager loading: select only necessary columns to reduce memory usage
      // This prevents loading hundreds of models with all columns when paginating
      $query = Publication::where('workspace_id', Auth::user()->current_workspace_id)
        ->with([
          'mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name', 'media_files.size', 'media_files.mime_type'),
          'mediaFiles.derivatives' => fn($q) => $q->select('id', 'media_file_id', 'file_path', 'file_name', 'derivative_type', 'size', 'width', 'height'),
          'scheduled_posts' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'scheduled_at'),
          'scheduled_posts.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
          'socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'published_at', 'error_message'),
          'socialPostLogs.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
          'campaigns' => fn($q) => $q->select('campaigns.id', 'campaigns.name', 'campaigns.status'),
          'user' => fn($q) => $q->select('users.id', 'users.name', 'users.email', 'users.photo_url')
        ])
        ->orderBy('created_at', 'desc');

      if ($request->has('status') && $request->status !== 'all') {
        $status = $request->status;
        if (method_exists(Publication::class, "scope" . ucfirst($status))) {
          $query->$status();
        }
      }

      if ($request->has(['date_start', 'date_end'])) {
        $query->byDateRange($request->date_start, $request->date_end);
      }

      if ($request->has('exclude_assigned') && $request->exclude_assigned === 'true') {
        $query->where(function ($q) use ($request) {
          $q->doesntHave('campaigns');
          if ($request->has('include_campaign_id')) {
            $q->orWhereHas('campaigns', fn($subQ) => $subQ->where('campaigns.id', $request->include_campaign_id));
          }
        });
      }

      // Safety limit for 'simplified' mode to prevent memory exhaustion
      // Without this, loading 500+ publications with all relationships can crash the container
      // Using simplePaginate() to avoid COUNT(*) query - only loads current page data
      $publications = ($request->query('simplified') === 'true')
        ? $query->limit(50)->get()
        : $query->simplePaginate($request->query('per_page', 6));

      return response()->json([
        'success' => true,
        'publications' => $publications,
        'status' => 200
      ]);
    });
  }

  public function store(StorePublicationRequest $request, CreatePublicationAction $action)
  {
    try {
      $publication = $action->execute($request->validated(), $request->file('media', []));

      // Clear cache after creating publication
      $this->clearPublicationCache(Auth::user()->current_workspace_id);

      return response()->json([
        'success' => true,
        'message' => 'Publication created successfully',
        'publication' => $publication,
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Creation failed: ' . $e->getMessage(),
        'status' => 500
      ], 500);
    }
  }

  public function show(Request $request, $id)
  {
    // Optimized eager loading with column selection
    $publication = Publication::with([
      'mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name', 'media_files.size', 'media_files.mime_type'),
      'mediaFiles.derivatives' => fn($q) => $q->select('id', 'media_file_id', 'file_path', 'file_name', 'derivative_type', 'size', 'width', 'height'),
      'scheduled_posts' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'scheduled_at'),
      'scheduled_posts.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
      'socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'published_at', 'error_message'),
      'socialPostLogs.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
      'campaigns' => fn($q) => $q->select('campaigns.id', 'campaigns.name', 'campaigns.status')
    ])->where('workspace_id', Auth::user()->current_workspace_id)
      ->findOrFail($id);

    return $request->wantsJson()
      ? response()->json(['success' => true, 'publication' => $publication])
      : view('publications.show');
  }

  public function update(UpdatePublicationRequest $request, $id, UpdatePublicationAction $action)
  {
    try {
      $publication = Publication::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);
      $publication = $action->execute($publication, $request->validated(), $request->file('media', []));

      // Clear cache after updating publication
      $this->clearPublicationCache(Auth::user()->current_workspace_id);

      return response()->json([
        'success' => true,
        'message' => 'Publication updated successfully',
        'publication' => $publication,
        'status' => 200
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Update failed: ' . $e->getMessage(),
        'status' => 500
      ], 500);
    }
  }

  public function publish(Request $request, $id, PublishPublicationAction $action)
  {
    try {
      $publication = Publication::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);

      $action->execute($publication, $request->input('platforms'), [
        'thumbnails' => $request->file('thumbnails', []),
        'platform_settings' => $request->input('platform_settings')
      ]);

      // Clear cache after publishing
      $this->clearPublicationCache(Auth::user()->current_workspace_id);

      return response()->json([
        'success' => true,
        'message' => 'Publishing started in background.',
        'status' => 'publishing'
      ]);
    } catch (\Exception $e) {
      return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
    }
  }

  public function unpublish(Request $request, $id, UnpublishPublicationAction $action)
  {
    $publication = Publication::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);
    $result = $action->execute($publication, $request->input('platform_ids'));

    return response()->json([
      'success' => $result['success'],
      'message' => $result['success'] ? 'Unpublished successfully' : 'Failed to unpublish',
      'details' => $result
    ], $result['success'] ? 200 : 500);
  }

  public function getPublishedPlatforms($id)
  {
    // Cache for 30 seconds to prevent repeated queries when opening publish modal
    // This dramatically improves performance when user clicks publish multiple times
    return cache()->remember("publication_{$id}_platforms", 30, function () use ($id) {
      $publication = Publication::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);

      // Optimized query: select only needed columns and use whereIn for better performance
      $scheduledAccountIds = ScheduledPost::where('publication_id', $publication->id)
        ->where('status', 'pending')
        ->pluck('social_account_id')
        ->unique()
        ->toArray();

      // Get only the latest log per account using a subquery for better performance
      // This avoids loading all logs and grouping in PHP
      $latestLogs = SocialPostLog::where('publication_id', $publication->id)
        ->select('social_account_id', 'status')
        ->whereIn('id', function ($query) use ($publication) {
          $query->selectRaw('MAX(id)')
            ->from('social_post_logs')
            ->where('publication_id', $publication->id)
            ->groupBy('social_account_id');
        })
        ->get();

      $statusGroups = ['published' => [], 'failed' => [], 'publishing' => [], 'removed_platforms' => []];

      foreach ($latestLogs as $log) {
        // Skip if this account has a pending scheduled post
        if (in_array($log->social_account_id, $scheduledAccountIds))
          continue;

        $status = $log->status === 'removed_on_platform' ? 'removed_platforms' : $log->status;

        if (isset($statusGroups[$status])) {
          $statusGroups[$status][] = $log->social_account_id;
        }
      }

      return response()->json([
        'published_platforms' => array_values(array_unique($statusGroups['published'])),
        'failed_platforms' => array_values(array_unique($statusGroups['failed'])),
        'publishing_platforms' => array_values(array_unique($statusGroups['publishing'])),
        'removed_platforms' => array_values(array_unique($statusGroups['removed_platforms'])),
        'scheduled_platforms' => $scheduledAccountIds
      ]);
    });
  }

  /**
   * Clear publication caches for a workspace
   */
  private function clearPublicationCache($workspaceId)
  {
    // Clear all cached publication queries for this workspace
    // Pattern: publications:{workspace_id}:*
    $pattern = "publications:{$workspaceId}:*";

    // Get all cache keys matching the pattern
    $keys = cache()->getRedis()->keys($pattern);

    if (!empty($keys)) {
      foreach ($keys as $key) {
        // Remove the Redis prefix if present
        $cleanKey = str_replace(config('database.redis.options.prefix'), '', $key);
        cache()->forget($cleanKey);
      }
    }
  }
}
