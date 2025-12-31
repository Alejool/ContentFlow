<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
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
use App\Notifications\PublicationAwaitingApprovalNotification;
use App\Notifications\PublicationApprovedNotification;

class PublicationController extends Controller
{
  use ApiResponse;

  public function index(Request $request)
  {
    $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

    if (!$workspaceId) {
      return $this->errorResponse('No active workspace found.', 404);
    }

    // Get cache version for the workspace to allow instant invalidation on any driver
    $cacheVersion = cache()->get("publications:{$workspaceId}:version", 1);

    // Cache key based on workspace, version, filters, and page
    $cacheKey = sprintf(
      'publications:%d:v%d:%s:%d',
      $workspaceId,
      $cacheVersion,
      md5(json_encode($request->all())),
      $request->query('page', 1)
    );

    return cache()->remember($cacheKey, 10, function () use ($request, $workspaceId) {
      // Optimized eager loading: select only necessary columns to reduce memory usage
      // We avoid loading deep derivatives and all logs for every item in the list view
      // to prevent massive JSON payloads that freeze the frontend.
      $query = Publication::where('workspace_id', $workspaceId)
        ->with([
          'mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name', 'media_files.size', 'media_files.mime_type'),
          'scheduled_posts' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'scheduled_at'),
          'scheduled_posts.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
          'socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status'),
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

      return $this->successResponse(['publications' => $publications]);
    });
  }

  public function store(StorePublicationRequest $request, CreatePublicationAction $action)
  {
    try {
      $publication = $action->execute($request->validated(), $request->file('media', []));

      // Clear cache after creating publication
      $this->clearPublicationCache(Auth::user()->current_workspace_id);

      return $this->successResponse(['publication' => $publication], 'Publication created successfully', 201);
    } catch (\Exception $e) {
      return $this->errorResponse('Creation failed: ' . $e->getMessage(), 500);
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
      ? $this->successResponse(['publication' => $publication])
      : view('publications.show');
  }

  public function update(UpdatePublicationRequest $request, $id, UpdatePublicationAction $action)
  {
    try {
      $publication = Publication::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);
      $publication = $action->execute($publication, $request->validated(), $request->file('media', []));

      // Clear cache after updating publication
      $this->clearPublicationCache(Auth::user()->current_workspace_id);

      return $this->successResponse(['publication' => $publication], 'Publication updated successfully');
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

      return $this->successResponse([
        'status' => 'publishing'
      ], 'Publishing started in background.');
    } catch (\Exception $e) {
      return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
    }
  }

  public function unpublish(Request $request, $id, UnpublishPublicationAction $action)
  {
    $publication = Publication::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);
    $result = $action->execute($publication, $request->input('platform_ids'));

    return $result['success']
      ? $this->successResponse(['details' => $result], 'Unpublished successfully')
      : $this->errorResponse('Failed to unpublish', 500, $result);
  }

  public function requestReview(Request $request, $id)
  {
    $publication = Publication::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);

    if (!in_array($publication->status, ['draft', 'failed'])) {
      return $this->errorResponse('Only draft or failed publications can be sent for review.', 422);
    }

    $publication->update(['status' => 'pending_review']);
    $this->clearPublicationCache(Auth::user()->current_workspace_id);

    // Notify workspace owner/admin
    $owner = $publication->workspace ? $publication->workspace->creator : null;
    if ($owner) {
      $owner->notify(new PublicationAwaitingApprovalNotification($publication, Auth::user()));
    }

    return $this->successResponse(['publication' => $publication], 'Publication sent for review.');
  }

  public function approve(Request $request, $id)
  {
    $publication = Publication::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);

    // Check if user has permission to approve (Owner or admin in workspace)
    if (!Auth::user()->hasPermission('manage-content', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to approve publications.', 403);
    }

    $publication->update([
      'status' => 'approved',
      'approved_by' => Auth::id(),
      'approved_at' => now(),
    ]);

    $this->clearPublicationCache(Auth::user()->current_workspace_id);

    // Notify the redactor (publication owner)
    $publication->user->notify(new PublicationApprovedNotification($publication, Auth::user()));

    return $this->successResponse(['publication' => $publication], 'Publication approved successfully.');
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
   * Get publication statistics for the current workspace
   */
  public function stats()
  {
    $workspaceId = Auth::user()->current_workspace_id;

    $stats = Publication::where('workspace_id', $workspaceId)
      ->selectRaw('status, count(*) as count')
      ->groupBy('status')
      ->get()
      ->pluck('count', 'status')
      ->toArray();

    // Ensure all statuses are present
    $allStatuses = ['draft', 'published', 'publishing', 'failed', 'pending_review', 'approved'];
    foreach ($allStatuses as $status) {
      if (!isset($stats[$status])) {
        $stats[$status] = 0;
      }
    }

    $stats['total'] = array_sum($stats);

    return $this->successResponse($stats);
  }

  /**
   * Clear publication caches for a workspace
   */
  private function clearPublicationCache($workspaceId)
  {
    if (!$workspaceId)
      return;

    // Increment version to effectively clear all workspace cache keys across any driver
    try {
      cache()->increment("publications:{$workspaceId}:version");
    } catch (\Exception $e) {
      // If increment fails (version doesn't exist), set it
      cache()->put("publications:{$workspaceId}:version", time(), now()->addDays(7));
    }

    // Still try Redis pattern clear if using Redis for extra cleanliness
    if (config('cache.default') === 'redis') {
      try {
        $pattern = "publications:{$workspaceId}:*";
        $keys = cache()->getRedis()->keys(config('cache.prefix') . $pattern);
        if (!empty($keys)) {
          foreach ($keys as $key) {
            $cleanKey = str_replace(config('cache.prefix'), '', $key);
            cache()->forget($cleanKey);
          }
        }
      } catch (\Exception $e) {
        // Silently fail Redis specific clearing
      }
    }
  }
}
