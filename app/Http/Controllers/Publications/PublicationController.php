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
use App\Actions\Publications\DeletePublicationAction;
use App\Notifications\PublicationAwaitingApprovalNotification;
use App\Notifications\PublicationApprovedNotification;
use App\Notifications\PublicationRejectedNotification;

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
          'mediaFiles.thumbnail' => fn($q) => $q->select('id', 'media_file_id', 'file_path', 'file_name', 'derivative_type'),
          'scheduled_posts' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'scheduled_at'),
          'scheduled_posts.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
          'socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status'),
          'campaigns' => fn($q) => $q->select('campaigns.id', 'campaigns.name', 'campaigns.status'),
          'user' => fn($q) => $q->select('users.id', 'users.name', 'users.email', 'users.photo_url'),
          'publisher' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
          'rejector' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
          'approvalLogs' => fn($q) => $q->latest('requested_at')->with(['requester:id,name,photo_url', 'reviewer:id,name,photo_url'])
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
    if (!Auth::user()->hasPermission('manage-content')) {
      return $this->errorResponse('You do not have permission to create publications.', 403);
    }

    try {
      $publication = $action->execute($request->validated(), $request->file('media', []));

      // Clear cache after creating publication
      $this->clearPublicationCache(Auth::user()->current_workspace_id);

      return $this->successResponse(['publication' => $publication], 'Publication created successfully', 201);
    } catch (\Exception $e) {
      return $this->errorResponse('Creation failed: ' . $e->getMessage(), 500);
    }
  }

  public function show(Request $request, Publication $publication)
  {
    $publication->load([
      'mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name', 'media_files.size', 'media_files.mime_type'),
      'mediaFiles.thumbnail' => fn($q) => $q->select('id', 'media_file_id', 'file_path', 'file_name', 'derivative_type'),
      'mediaFiles.derivatives' => fn($q) => $q->select('id', 'media_file_id', 'file_path', 'file_name', 'derivative_type', 'size', 'width', 'height'),
      'scheduled_posts' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'scheduled_at'),
      'scheduled_posts.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
      'socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'published_at', 'error_message'),
      'socialPostLogs.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
      'campaigns' => fn($q) => $q->select('campaigns.id', 'campaigns.name', 'campaigns.status'),
      'publisher' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
      'rejector' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
      'approvalLogs' => fn($q) => $q->latest('requested_at')->with(['requester:id,name,photo_url', 'reviewer:id,name,photo_url'])
    ]);

    return $request->wantsJson()
      ? $this->successResponse(['publication' => $publication])
      : redirect()->route('manage-content.index', ['tab' => 'publications', 'id' => $publication->id]);
  }

  public function update(UpdatePublicationRequest $request, Publication $publication, UpdatePublicationAction $action)
  {
    if (!Auth::user()->hasPermission('manage-content', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to update this publication.', 403);
    }

    try {
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

  public function publish(Request $request, Publication $publication, PublishPublicationAction $action)
  {
    // Allow if has publish permission OR if it's already approved
    $canPublish = (Auth::user()->hasPermission('publish', $publication->workspace_id) || $publication->isApproved()) &&
      Auth::user()->hasPermission('manage-content', $publication->workspace_id);

    if (!$canPublish) {
      return $this->errorResponse('You do not have permission to publish this content.', 403);
    }

    try {
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

  public function unpublish(Request $request, Publication $publication, UnpublishPublicationAction $action)
  {
    $result = $action->execute($publication, $request->input('platform_ids'));

    return $result['success']
      ? $this->successResponse(['details' => $result], 'Unpublished successfully')
      : $this->errorResponse('Failed to unpublish', 500, $result);
  }

  public function destroy(Publication $publication, DeletePublicationAction $action)
  {
    $workspaceId = $publication->workspace_id;

    if (!Auth::user()->hasPermission('publish', $workspaceId) || !Auth::user()->hasPermission('manage-content', $workspaceId)) {
      return $this->errorResponse('You do not have permission to delete this publication.', 403);
    }

    try {
      $action->execute($publication);

      $this->clearPublicationCache($workspaceId);

      return $this->successResponse(null, 'Publication deleted successfully');
    } catch (\Exception $e) {
      return $this->errorResponse('Deletion failed: ' . $e->getMessage(), 500);
    }
  }

  public function requestReview(Request $request, Publication $publication)
  {
    if (!Auth::user()->hasPermission('manage-content', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to request review.', 403);
    }

    $allowedStatuses = ['draft', 'failed', 'rejected'];
    if (!in_array($publication->status, $allowedStatuses)) {
      return $this->errorResponse('Only draft, rejected or failed publications can be sent for review.', 422);
    }

    $updateData = ['status' => 'pending_review'];
    if ($request->has('platform_settings')) {
      $updateData['platform_settings'] = $request->platform_settings;
    }

    $publication->update($updateData);

    // Create approval log entry
    \App\Models\ApprovalLog::create([
      'publication_id' => $publication->id,
      'requested_by' => Auth::id(),
      'requested_at' => now(),
    ]);

    $this->clearPublicationCache(Auth::user()->current_workspace_id);

    // Notify all users in the workspace who have the 'approve' permission
    // First, find the roles that have the 'approve' permission
    $approverRoleIds = \App\Models\Role::whereHas('permissions', function ($q) {
      $q->where('slug', 'approve');
    })->pluck('id');

    // Then find users in this workspace with those roles
    $approvers = $publication->workspace->users()
      ->wherePivotIn('role_id', $approverRoleIds)
      ->get();

    foreach ($approvers as $approver) {
      $approver->notify(new PublicationAwaitingApprovalNotification($publication, Auth::user()));
    }

    return $this->successResponse(['publication' => $publication], 'Publication sent for review.');
  }

  public function approve(Request $request, Publication $publication)
  {
    // Check if user has permission to approve (Owner or admin in workspace)
    if (!Auth::user()->hasPermission('approve', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to approve publications.', 403);
    }

    $publication->update([
      'status' => 'approved',
      'approved_by' => Auth::id(),
      'approved_at' => now(),
      'approved_retries_remaining' => 3, // Set the retry limit
      // Clear rejection fields if previously rejected
      'rejected_by' => null,
      'rejected_at' => null,
      'rejection_reason' => null,
    ]);

    // Update the most recent approval log
    $latestLog = $publication->approvalLogs()
      ->whereNull('reviewed_at')
      ->latest('requested_at')
      ->first();

    if ($latestLog) {
      $latestLog->update([
        'reviewed_by' => Auth::id(),
        'reviewed_at' => now(),
        'action' => 'approved',
      ]);
    }

    $this->clearPublicationCache(Auth::user()->current_workspace_id);

    // Notify the redactor (publication owner)
    $publication->user->notify(new PublicationApprovedNotification($publication, Auth::user()));

    // Load approver relationship and logs for response
    $publication->load(['approvedBy:id,name,email', 'approvalLogs' => fn($q) => $q->latest('requested_at')->with(['requester:id,name,photo_url', 'reviewer:id,name,photo_url'])]);

    return $this->successResponse([
      'publication' => $publication,
    ], 'Publication approved successfully.');
  }

  /** @var \App\Models\User $user */

  public function reject(Request $request, Publication $publication)
  {
    if (!Auth::user()->hasPermission('approve', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to reject publications.', 403);
    }

    $request->validate([
      'rejection_reason' => 'nullable|string|max:500',
    ]);

    $publication->update([
      'status' => 'rejected',
      'rejected_by' => Auth::id(),
      'rejected_at' => now(),
      'rejection_reason' => $request->input('rejection_reason'),
      // Clear approval fields if previously approved
      'approved_by' => null,
      'approved_at' => null,
    ]);

    // Update the most recent approval log
    $latestLog = $publication->approvalLogs()
      ->whereNull('reviewed_at')
      ->latest('requested_at')
      ->first();

    if ($latestLog) {
      $latestLog->update([
        'reviewed_by' => Auth::id(),
        'reviewed_at' => now(),
        'action' => 'rejected',
        'rejection_reason' => $request->input('rejection_reason'),
      ]);
    }

    $this->clearPublicationCache(Auth::user()->current_workspace_id);

    // Notify the publication owner
    $publication->user->notify(new PublicationRejectedNotification($publication, Auth::user()));

    // Load rejector relationship for response
    $publication->load(['rejectedBy:id,name,email', 'approvalLogs' => fn($q) => $q->latest('requested_at')->with(['requester:id,name,photo_url', 'reviewer:id,name,photo_url'])]);

    return $this->successResponse([
      'publication' => $publication,
    ], 'Publication rejected successfully.');
  }

  public function getPublishedPlatforms(Publication $publication)
  {
    $id = $publication->id;
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
    $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

    if (!$workspaceId) {
      return $this->successResponse([
        'draft' => 0,
        'published' => 0,
        'publishing' => 0,
        'failed' => 0,
        'pending_review' => 0,
        'approved' => 0,
        'scheduled' => 0,
        'total' => 0
      ]);
    }

    \Illuminate\Support\Facades\Log::info("Stats requested. Workspace: {$workspaceId}");
    $publications = Publication::withoutGlobalScopes()->where('workspace_id', $workspaceId)
      ->withCount(['scheduled_posts as pending_schedules_count' => function ($q) {
        $q->where('status', 'pending');
      }])
      ->get();

    \Illuminate\Support\Facades\Log::info("Stats found " . $publications->count() . " publications.");

    $stats = [
      'draft' => 0,
      'published' => 0,
      'publishing' => 0,
      'failed' => 0,
      'pending_review' => 0,
      'approved' => 0,
      'scheduled' => 0,
    ];

    foreach ($publications as $pub) {
      $status = $pub->status;
      // \Illuminate\Support\Facades\Log::info("Publication ID {$pub->id} raw status: '{$status}'");

      // Logic to determine display status
      // Publishing, Published and Failed have priority
      if ($status === 'publishing' || $status === 'publishi') {
        $stats['publishing']++;
        if ($status === 'publishi') $pub->update(['status' => 'publishing']);
      } elseif ($status === 'published' || $status === 'publis') {
        $stats['published']++;

        // Auto-fix truncated status if encountered
        if ($status === 'publis') {
          $pub->update(['status' => 'published']);
        }
      } elseif ($status === 'failed') {
        $stats['failed']++;
      } elseif (!empty($pub->scheduled_at) || $pub->pending_schedules_count > 0) {
        // Should check scheduled first if status is draft, but scheduled_at exists
        // If status is 'scheduled' explicitly, it falls here (if we add check)
        $stats['scheduled']++;
      } else {
        // Fallback to the database status
        if (isset($stats[$status])) {
          $stats[$status]++;
        } else {
          // Log unknown status falling to draft only if it's truly weird
          if ($status !== 'draft') {
            \Illuminate\Support\Facades\Log::warning("Unknown status falling to draft: '{$status}'");
          }
          $stats['draft']++;
        }
      }
    }

    $stats['total'] = count($publications);
    \Illuminate\Support\Facades\Log::info("Returning stats:", $stats);

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
