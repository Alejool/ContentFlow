<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Models\Publications\Publication;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
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
use App\Notifications\PublicationCancelledNotification;
use App\Events\Publications\PublicationUpdated;
use App\Events\PublicationStatusUpdated;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

use App\Models\Social\ScheduledPost;
use App\Models\Social\SocialPostLog;
use App\Models\Logs\ApprovalLog;
use App\Models\Role\Role;

use App\Jobs\ProcessBackgroundUpload;
use App\Models\MediaFiles\MediaFile;

use App\Models\User;
use App\Models\Publications\PublicationLock;
use App\Services\Validation\ContentValidationService;
use Maatwebsite\Excel\Facades\Excel;

class PublicationController extends Controller
{
  use ApiResponse;

  public function index(Request $request)
  {
    /** @var User $user */
    $user = Auth::user();
    $workspaceId = $user->current_workspace_id ?? $user->workspaces()->first()?->id;

    if (!$workspaceId) {
      return $this->errorResponse('No active workspace found.', 404);
    }

    if (!$user->hasPermission('manage-content', $workspaceId) && !$user->hasPermission('view-content', $workspaceId)) {
      return $this->errorResponse('You do not have permission to view publications.', 403);
    }

    // Get cache version for the workspace to allow instant invalidation on any driver
    $cacheVersion = cache()->get("publications:{$workspaceId}:version", 1);

    // Cache key based on workspace, version, filters, and page
    // Updated to v2-fix to purge stale sorted results
    $cacheKey = sprintf(
      'publications:%d:v%d-fixed:%s:%d',
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
          'socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'platform', 'status', 'post_url'),
          'campaigns' => fn($q) => $q->select('campaigns.id', 'campaigns.name', 'campaigns.status'),
          'user' => fn($q) => $q->select('users.id', 'users.name', 'users.email', 'users.photo_url'),
          'publisher' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
          'rejector' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
          'rejector' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
          'approvalLogs' => fn($q) => $q->latest('requested_at')->with(['requester:id,name,photo_url', 'reviewer:id,name,photo_url']),
          'activities' => fn($q) => $q->orderBy('created_at', 'desc')->with('user:id,name,photo_url')
        ]);

      if ($request->has('status') && $request->status !== 'all') {
        $statuses = explode(',', $request->status);
        $query->whereIn('status', $statuses);
      }

      if ($request->has('search') && !empty($request->search)) {
        $query->where('title', 'LIKE', '%' . $request->search . '%');
      }

      if ($request->has('platform') && !empty($request->platform)) {
        $platforms = $request->input('platform', []);
        if (!is_array($platforms)) {
          $platforms = [$platforms];
        }
        if (!empty($platforms)) {
          $query->whereHas('socialPostLogs', function ($logQ) use ($platforms) {
            $logQ->whereIn('platform', $platforms)
              ->whereIn('status', ['published', 'success']);
          });
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

      $sort = $request->input('sort', 'newest');
      Log::info('PublicationController@index - Sorting:', ['sort_val' => $sort, 'request_all' => $request->all()]);

      switch ($sort) {
        case 'oldest':
          $query->orderBy('created_at', 'asc');
          break;
        case 'title_asc':
          $query->orderBy('title', 'asc')->orderBy('created_at', 'desc');
          break;
        case 'title_desc':
          $query->orderBy('title', 'desc')->orderBy('created_at', 'desc');
          break;
        case 'newest':
        default:
          $query->orderBy('created_at', 'desc');
          break;
      }

      // Safety limit for 'simplified' mode to prevent memory exhaustion
      // Without this, loading 500+ publications with all relationships can crash the container
      // Using simplePaginate() to avoid COUNT(*) query - only loads current page data
      $publications = ($request->query('simplified') === 'true')
        ? $query->limit(50)->get()
        : $query->paginate($request->query('per_page', 10));

      return $this->successResponse(['publications' => $publications]);
    });
  }

  public function store(StorePublicationRequest $request, CreatePublicationAction $action)
  {
    $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;
    if (!Auth::user()->hasPermission('manage-content', $workspaceId)) {
      return $this->errorResponse('You do not have permission to create publications.', 403);
    }

    try {
      $data = $request->validated();
      // Normalize scheduled_at to UTC using client's timezone header
      if (!empty($data['scheduled_at'])) {
        if (!Auth::user()->hasPermission('publish', $workspaceId)) {
          // User cannot schedule, so we ignore the scheduled_at date and force draft
          unset($data['scheduled_at']);
          $data['status'] = 'draft';
        } else {
          try {
            $tz = $request->header('X-User-Timezone');
            $dt = $tz ? Carbon::parse($data['scheduled_at'], $tz)->setTimezone('UTC') : Carbon::parse($data['scheduled_at'])->setTimezone('UTC');
            $data['scheduled_at'] = $dt->toIso8601String();
          } catch (\Exception $e) {
            // If parsing fails, keep original value and let deeper validation handle it
          }
        }
      } else {
        // If no schedule date, ensure they aren't trying to force a published/scheduled status without permission
        if (!Auth::user()->hasPermission('publish', $workspaceId) && in_array($data['status'] ?? '', ['published', 'scheduled'])) {
          $data['status'] = 'draft';
        }
      }

      // Handle media: can be File objects OR metadata arrays from S3 Direct Upload
      $mediaInput = $request->input('media', []);
      $mediaFiles = $request->file('media', []);

      // If media input exists but no files, it's S3 metadata
      $newFiles = !empty($mediaFiles) ? $mediaFiles : $mediaInput;

      $publication = $action->execute($data, $newFiles);

      $publication->logActivity('created', $data);

      // Clear cache after creating publication
      $this->clearPublicationCache(Auth::user()->current_workspace_id);

      return $this->successResponse(['publication' => $publication], 'Publication created successfully', 201);
    } catch (\Exception $e) {
      return $this->errorResponse('Creation failed: ' . $e->getMessage(), 500);
    }
  }

  public function show(Request $request, Publication $publication)
  {
    if (!Auth::user()->hasPermission('manage-content', $publication->workspace_id) && !Auth::user()->hasPermission('view-content', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to view this publication.', 403);
    }

    $publication->load([
      'mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name', 'media_files.size', 'media_files.mime_type'),
      'mediaFiles.thumbnail' => fn($q) => $q->select('id', 'media_file_id', 'file_path', 'file_name', 'derivative_type'),
      'mediaFiles.derivatives' => fn($q) => $q->select('id', 'media_file_id', 'file_path', 'file_name', 'derivative_type', 'size', 'width', 'height'),
      'scheduled_posts' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'scheduled_at'),
      'scheduled_posts.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
      'socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'platform', 'status', 'post_url', 'published_at', 'error_message'),
      'socialPostLogs.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
      'campaigns' => fn($q) => $q->select('campaigns.id', 'campaigns.name', 'campaigns.status'),
      'publisher' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
      'rejector' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
      'rejector' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
      'approvalLogs' => fn($q) => $q->latest('requested_at')->with(['requester:id,name,photo_url', 'reviewer:id,name,photo_url']),
      'activities' => fn($q) => $q->orderBy('created_at', 'desc')->with('user:id,name,photo_url')
    ]);

    // Check for media lock
    $mediaLockUserId = cache()->get("publication:{$publication->id}:media_lock");
    $mediaLockedBy = null;
    if ($mediaLockUserId) {
      $mediaLockedBy = User::find($mediaLockUserId)?->only(['id', 'name', 'photo_url']);
    }

    // Check for approval workflow lock
    $approvalLock = null;
    if ($publication->isLockedForEditing()) {
      $reason = $publication->status === 'pending_review' 
        ? 'This publication is awaiting approval and cannot be edited.' 
        : 'This publication has been approved and is ready to publish. It cannot be edited.';
      
      $approvalLock = [
        'locked_by' => 'approval_workflow',
        'status' => $publication->status,
        'reason' => $reason,
      ];
    }

    // Append to publication object (dynamically)
    $publication->media_locked_by = $mediaLockedBy;
    $publication->approval_lock = $approvalLock;

    return $request->wantsJson()
      ? $this->successResponse(['publication' => $publication])
      : redirect()->route('content.index', ['tab' => 'publications', 'id' => $publication->id]);
  }

  public function update(UpdatePublicationRequest $request, Publication $publication, UpdatePublicationAction $action)
  {
    if (!Auth::user()->hasPermission('manage-content', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to update this publication.', 403);
    }

    // Check if publication is locked for editing (only pending_review)
    if ($publication->isLockedForEditing()) {
      return $this->errorResponse(
        'This publication is awaiting approval and cannot be edited. It must be rejected before changes can be made.',
        423,
        [
          'status' => $publication->status,
          'locked_reason' => 'Publication is awaiting approval'
        ]
      );
    }

    $lock = PublicationLock::where('publication_id', $publication->id)
      ->where('expires_at', '>', now())
      ->first();

    if ($lock && $lock->user_id !== Auth::id()) {
      return $this->errorResponse('Publication is currently locked by ' . $lock->user->name, 423, [
        'locked_by' => 'user',
        'user_name' => $lock->user->name,
        'expires_at' => $lock->expires_at->toIso8601String(),
      ]);
    }

    try {
      $data = $request->validated();
      
      // RBAC ENDFORCEMENT: Check for publish permission
      if (!Auth::user()->hasPermission('publish', $publication->workspace_id)) {
        // If trying to set scheduled_at, remove it
        if (!empty($data['scheduled_at'])) {
          unset($data['scheduled_at']);
        }

        // If trying to change status to restricted values
        if (isset($data['status']) && in_array($data['status'], ['scheduled', 'published'])) {
          // Revert to draft or keep current if safe
          $data['status'] = 'draft';
        }
      }

      // Normalize scheduled_at to UTC using client's timezone header
      if (!empty($data['scheduled_at'])) {
        try {
          $tz = $request->header('X-User-Timezone');
          $dt = $tz ? Carbon::parse($data['scheduled_at'], $tz)->setTimezone('UTC') : Carbon::parse($data['scheduled_at'])->setTimezone('UTC');
          $data['scheduled_at'] = $dt->toIso8601String();
        } catch (\Exception $e) {
          // leave as-is
        }
      }

      // Handle media: can be File objects OR metadata arrays from S3 Direct Upload
      $mediaInput = $request->input('media', []);
      $mediaFiles = $request->file('media', []);

      // If media input exists but no files, it's S3 metadata
      $newFiles = !empty($mediaFiles) ? $mediaFiles : $mediaInput;

      $publication = $action->execute($publication, $data, $newFiles);

      $publication->logActivity('updated', ['changes' => array_keys($data)]);

      // Load updated relationships to ensure frontend gets fresh data
      $publication->load([
        'mediaFiles.derivatives',
        'scheduled_posts.socialAccount',
        'socialPostLogs.socialAccount',
        'campaigns'
      ]);

      // Clear cache after updating publication
      $this->clearPublicationCache(Auth::user()->current_workspace_id);

      broadcast(new PublicationUpdated($publication))->toOthers();

      return $this->successResponse(['publication' => $publication], 'Publication updated successfully');
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => __('messages.publication.update_failed', ['error' => $e->getMessage()]),
        'status' => 500
      ], 500);
    }
  }

  public function publish(Request $request, Publication $publication, PublishPublicationAction $action)
  {
    // Check permissions first
    $hasPublishPermission = Auth::user()->hasPermission('publish', $publication->workspace_id);
    $hasManageContentPermission = Auth::user()->hasPermission('manage-content', $publication->workspace_id);
    
    if (!$hasManageContentPermission) {
      return $this->errorResponse('You do not have permission to manage content.', 403);
    }

    // Verify publication can be published based on status and permissions
    if (!$publication->canBePublished($hasPublishPermission)) {
      // If pending review, show specific message
      if ($publication->status === 'pending_review') {
        return $this->errorResponse(
          __('publications.errors.pending_review'),
          422,
          ['current_status' => $publication->status]
        );
      }
      
      // Otherwise, needs approval
      return $this->errorResponse(
        __('publications.errors.not_approved'),
        422,
        ['current_status' => $publication->status]
      );
    }

    try {
      $action->execute($publication, $request->input('platforms'), [
        'thumbnails' => $request->file('thumbnails', []),
        'platform_settings' => $request->input('platform_settings')
      ]);

      $publication->logActivity('publishing', ['platforms' => $request->input('platforms')]);

      // Clear cache after publishing
      $this->clearPublicationCache(Auth::user()->current_workspace_id);

      broadcast(new PublicationUpdated($publication))->toOthers();

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

    if (!Auth::user()->hasPermission('manage-content', $workspaceId)) {
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

  /**
   * Duplicate the specified publication
   */
  public function duplicate(Publication $publication)
  {
    if (!Auth::user()->hasPermission('manage-content', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to duplicate this publication.', 403);
    }

    try {
      // Load relationships
      $publication->load(['mediaFiles', 'campaigns']);

      // Generate unique title with number
      $baseTitle = $publication->title;
      $counter = 1;
      $newTitle = $baseTitle . ' ' . $counter;

      while (Publication::where('workspace_id', $publication->workspace_id)
        ->where('title', $newTitle)
        ->exists()
      ) {
        $counter++;
        $newTitle = $baseTitle . ' ' . $counter;
      }

      $newPublication = Publication::create([
        'user_id' => Auth::id(),
        'workspace_id' => $publication->workspace_id,
        'title' => $newTitle,
        'slug' => Str::slug($newTitle) ?: Str::random(10),
        'body' => $publication->body,
        'description' => $publication->description,
        'hashtags' => $publication->hashtags,
        'url' => $publication->url,
        'goal' => $publication->goal,
        'status' => 'draft',
        'platform_settings' => $publication->platform_settings,
        'approved_by' => null,
        'approved_at' => null,
        'approved_retries_remaining' => 3,
        'published_by' => null,
        'published_at' => null,
        'rejected_by' => null,
        'rejected_at' => null,
        'rejection_reason' => null,
        'scheduled_at' => null,
      ]);

      // Duplicate media files with their order
      if ($publication->mediaFiles->isNotEmpty()) {
        $syncData = [];
        foreach ($publication->mediaFiles as $mediaFile) {
          $syncData[$mediaFile->id] = ['order' => $mediaFile->pivot->order];
        }
        $newPublication->mediaFiles()->sync($syncData);
      }

      // Sync the same campaigns
      if ($publication->campaigns->isNotEmpty()) {
        $syncData = [];
        foreach ($publication->campaigns as $campaign) {
          $syncData[$campaign->id] = ['order' => $campaign->pivot->order];
        }
        $newPublication->campaigns()->sync($syncData);
      }

      $newPublication->logActivity('duplicated', ['original_id' => $publication->id]);

      // Clear cache after creating publication
      $this->clearPublicationCache(Auth::user()->current_workspace_id);

      return $this->successResponse(['publication' => $newPublication->load(['mediaFiles', 'campaigns'])], 'Publication duplicated successfully', 201);
    } catch (\Exception $e) {
      return $this->errorResponse('Duplication failed: ' . $e->getMessage(), 500);
    }
  }

  public function requestReview(Request $request, Publication $publication)
  {
    if (!Auth::user()->hasPermission('manage-content', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to request review.', 403);
    }

    // Allow requesting review for draft, failed, or rejected publications
    $allowedStatuses = ['draft', 'failed', 'rejected'];
    if (!in_array($publication->status, $allowedStatuses)) {
      return $this->errorResponse(__('publications.errors.only_draft_failed_rejected_can_request_review'), 422);
    }

    // Lock the publication by changing status to pending_review
    $updateData = [
      'status' => 'pending_review',
      // Clear any previous rejection data
      'rejected_by' => null,
      'rejected_at' => null,
      'rejection_reason' => null,
    ];
    
    if ($request->has('platform_settings')) {
      $updateData['platform_settings'] = $request->platform_settings;
    }

    $publication->update($updateData);

    ApprovalLog::create([
      'publication_id' => $publication->id,
      'requested_by' => Auth::id(),
      'requested_at' => now(),
    ]);

    $publication->logActivity('requested_approval', [
      'note' => 'Publication locked for review - no edits allowed until approved or rejected'
    ]);

    $this->clearPublicationCache(Auth::user()->current_workspace_id);

    // Notify all users in the workspace who have the 'approve' permission
    // First, find the roles that have the 'approve' permission
    $approverRoleIds = Role::whereHas('permissions', function ($q) {
      $q->where('slug', 'approve');
    })->pluck('id');

    // Then find users in this workspace with those roles
    $approvers = $publication->workspace->users()
      ->wherePivotIn('role_id', $approverRoleIds)
      ->get();

    foreach ($approvers as $approver) {
      $approver->notify(new PublicationAwaitingApprovalNotification($publication, Auth::user()));
    }

    // Broadcast lock change to notify all users in real-time
    broadcast(new \App\Events\Publications\PublicationLockChanged(
      $publication->id, 
      [
        'locked_by' => 'approval_workflow',
        'status' => 'pending_review',
        'reason' => 'This publication is awaiting approval and cannot be edited.'
      ],
      $publication->workspace_id
    ))->toOthers();

    broadcast(new PublicationUpdated($publication))->toOthers();

    return $this->successResponse(['publication' => $publication], 'Publication sent for review and locked for editing.');
  }

  public function approve(Request $request, Publication $publication)
  {
    // Check if user has permission to approve (Owner or admin in workspace)
    if (!Auth::user()->hasPermission('approve', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to approve publications.', 403);
    }

    // Only publications in pending_review can be approved
    if ($publication->status !== 'pending_review') {
      return $this->errorResponse('Only publications in pending review can be approved.', 422);
    }

    $request->validate([
      'comment' => 'nullable|string|max:500',
    ]);

    $publication->update([
      'status' => 'approved',
      'approved_by' => Auth::id(),
      'approved_at' => now(),
      'approved_retries_remaining' => 3,
      'rejected_by' => null,
      'rejected_at' => null,
      'rejection_reason' => null,
    ]);

    $latestLog = $publication->approvalLogs()
      ->whereNull('reviewed_at')
      ->latest('requested_at')
      ->first();

    if ($latestLog) {
      $latestLog->update([
        'reviewed_by' => Auth::id(),
        'reviewed_at' => now(),
        'action' => 'approved',
        'rejection_reason' => $request->input('comment'), // Using rejection_reason field for comments
      ]);
    }

    $publication->logActivity('approved', [
      'approver' => Auth::user()->name,
      'comment' => $request->input('comment'),
      'note' => 'Publication approved and ready to publish'
    ]);

    $this->clearPublicationCache(Auth::user()->current_workspace_id);

    // Notify the redactor (publication owner)
    $publication->load('user');
    if ($publication->user) {
      $publication->user->notify(new PublicationApprovedNotification($publication, Auth::user()));
    }

    // Broadcast lock removal to notify all users in real-time (publication is now editable)
    broadcast(new \App\Events\Publications\PublicationLockChanged(
      $publication->id, 
      null, // No lock - publication can be edited (will revert to pending if edited)
      $publication->workspace_id
    ))->toOthers();

    broadcast(new PublicationUpdated($publication))->toOthers();

    // Load approver relationship and logs for response
    $publication->load(['approvedBy:id,name,email', 'approvalLogs' => fn($q) => $q->latest('requested_at')->with(['requester:id,name,photo_url', 'reviewer:id,name,photo_url'])]);

    return $this->successResponse([
      'publication' => $publication,
    ], 'Publication approved successfully and ready to publish.');
  }

  /** @var User $user */

  public function reject(Request $request, Publication $publication)
  {
    /** @var User $user */
    $user = Auth::user();
    if (!$user->hasPermission('approve', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to reject publications.', 403);
    }

    // Only publications in pending_review can be rejected
    if ($publication->status !== 'pending_review') {
      return $this->errorResponse('Only publications in pending review can be rejected.', 422);
    }

    $request->validate([
      'rejection_reason' => 'required|string|min:10|max:500',
    ], [
      'rejection_reason.required' => __('validation.rejection_reason_required'),
      'rejection_reason.min' => __('validation.rejection_reason_min'),
      'rejection_reason.max' => __('validation.rejection_reason_max'),
    ]);

    // Reject and unlock by changing status to draft
    $publication->update([
      'status' => 'draft',
      'rejected_by' => Auth::id(),
      'rejected_at' => now(),
      'rejection_reason' => $request->input('rejection_reason'),
      'approved_by' => null,
      'approved_at' => null,
      'approved_retries_remaining' => 2,
    ]);

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

    $publication->logActivity('rejected', [
      'reason' => $request->input('rejection_reason'),
      'rejector' => Auth::user()->name,
      'note' => 'Publication unlocked for editing - changes required before resubmission'
    ]);

    $this->clearPublicationCache(Auth::user()->current_workspace_id);

    // Notify the publication owner
    $publication->load('user');
    if ($publication->user) {
      $publication->user->notify(new PublicationRejectedNotification($publication, Auth::user()));
    }

    // Broadcast lock removal to notify all users in real-time
    broadcast(new \App\Events\Publications\PublicationLockChanged(
      $publication->id, 
      null, // No lock
      $publication->workspace_id
    ))->toOthers();

    broadcast(new PublicationUpdated($publication))->toOthers();

    // Load rejector relationship for response
    $publication->load(['rejectedBy:id,name,email', 'approvalLogs' => fn($q) => $q->latest('requested_at')->with(['requester:id,name,photo_url', 'reviewer:id,name,photo_url'])]);

    return $this->successResponse([
      'publication' => $publication,
    ], 'Publication rejected and unlocked for editing.');
  }

  public function cancel(Request $request, Publication $publication)
  {
    if (!Auth::user()->hasPermission('manage-content', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to cancel this publication.', 403);
    }

    $oldStatus = $publication->status;

    $allowedStatuses = ['publishing', 'processing', 'scheduled', 'pending_review'];
    if (!in_array($oldStatus, $allowedStatuses)) {
      return $this->errorResponse('This publication cannot be cancelled in its current state.', 422);
    }

    // Check if specific platform(s) should be cancelled
    $platformIds = $request->input('platform_ids', []);
    
    \Log::info('Cancel publication request', [
      'publication_id' => $publication->id,
      'platform_ids' => $platformIds,
      'platform_ids_type' => gettype($platformIds),
      'platform_ids_empty' => empty($platformIds),
      'request_all' => $request->all()
    ]);
    
    if (!empty($platformIds) && is_array($platformIds) && count($platformIds) > 0) {
      \Log::info('Canceling specific platforms', ['platform_ids' => $platformIds]);
      
      // Cancel only specific platforms
      $updated = $publication->socialPostLogs()
        ->whereIn('social_account_id', $platformIds)
        ->whereIn('status', ['pending', 'publishing'])
        ->update([
          'status' => 'failed',
          'error_message' => 'Cancelado por el usuario',
          'updated_at' => now(),
        ]);
        
      \Log::info('Updated social post logs', ['count' => $updated, 'platform_ids' => $platformIds]);

      // Try to delete specific platform jobs from queue
      try {
        foreach ($platformIds as $platformId) {
          \Illuminate\Support\Facades\DB::table('jobs')
            ->where('payload', 'like', '%PublishSocialPostJob%')
            ->where('payload', 'like', '%"id":' . $publication->id . '%')
            ->where('payload', 'like', '%"social_account_id":' . $platformId . '%')
            ->delete();
          
          \Illuminate\Support\Facades\DB::table('failed_jobs')
            ->where('payload', 'like', '%PublishSocialPostJob%')
            ->where('payload', 'like', '%"id":' . $publication->id . '%')
            ->where('payload', 'like', '%"social_account_id":' . $platformId . '%')
            ->delete();
        }
      } catch (\Exception $e) {
        \Log::warning("Could not delete queued jobs for platforms in publication {$publication->id}: " . $e->getMessage());
      }

      $publication->logActivity('platform_cancelled', [
        'platform_ids' => $platformIds,
        'previous_status' => $oldStatus
      ]);

      broadcast(new PublicationStatusUpdated(Auth::id(), $publication->id, $publication->status))->toOthers();
      broadcast(new PublicationUpdated($publication))->toOthers();

      $this->clearPublicationCache($publication->workspace_id);

      return $this->successResponse([
        'publication' => $publication->load(['socialPostLogs', 'mediaFiles'])
      ], 'Plataforma(s) cancelada(s) correctamente.');
    }

    // Cancel all platforms (original behavior)
    $publication->update([
      'status' => 'failed',
      'updated_at' => now(),
    ]);

    // Actualizar logs de redes sociales
    $publication->socialPostLogs()
      ->whereIn('status', ['pending', 'publishing'])
      ->update([
        'status' => 'failed',
        'error_message' => 'Cancelado por el usuario',
        'updated_at' => now(),
      ]);

    // Eliminar jobs pendientes de la cola
    try {
      \Illuminate\Support\Facades\DB::table('jobs')
        ->where('payload', 'like', '%PublishSocialPostJob%')
        ->where('payload', 'like', '%"id":' . $publication->id . '%')
        ->delete();
      
      \Illuminate\Support\Facades\DB::table('failed_jobs')
        ->where('payload', 'like', '%PublishSocialPostJob%')
        ->where('payload', 'like', '%"id":' . $publication->id . '%')
        ->delete();
    } catch (\Exception $e) {
      \Log::warning("Could not delete queued jobs for publication {$publication->id}: " . $e->getMessage());
    }

    $publication->logActivity('cancelled', ['previous_status' => $oldStatus]);

    $publication->user->notify(new PublicationCancelledNotification($publication));
    
    if ($publication->workspace && ($publication->workspace->discord_webhook_url || $publication->workspace->slack_webhook_url)) {
      $publication->workspace->notify(new PublicationCancelledNotification($publication));
    }

    broadcast(new PublicationStatusUpdated(Auth::id(), $publication->id, 'failed'))->toOthers();
    broadcast(new PublicationUpdated($publication))->toOthers();

    $this->clearPublicationCache($publication->workspace_id);

    return $this->successResponse([
      'publication' => $publication->load(['socialPostLogs', 'mediaFiles'])
    ], 'Publicación cancelada correctamente.');
  }

  public function getPublishedPlatforms(Publication $publication)
  {
    $id = $publication->id;

    $publication = Publication::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);

    $scheduledAccountIds = ScheduledPost::where('publication_id', $publication->id)
      ->where('status', 'pending')
      ->pluck('social_account_id')
      ->unique()
      ->toArray();

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
      if (in_array($log->social_account_id, $scheduledAccountIds))
        continue;

      $status = $log->status === 'removed_on_platform' ? 'removed_platforms' : $log->status;

      if ($status === 'pending') $status = 'publishing';

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

    $publications = Publication::withoutGlobalScopes()->where('workspace_id', $workspaceId)
      ->withCount(['scheduled_posts as pending_schedules_count' => function ($q) {
        $q->where('status', 'pending');
      }])
      ->get();

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

      if ($status === 'publishing' || $status === 'publishi') {
        $stats['publishing']++;
        if ($status === 'publishi') $pub->update(['status' => 'publishing']);
      } elseif ($status === 'published' || $status === 'publis') {
        $stats['published']++;

        if ($status === 'publis') {
          $pub->update(['status' => 'published']);
        }
      } elseif ($status === 'failed') {
        $stats['failed']++;
      } elseif (!empty($pub->scheduled_at) || $pub->pending_schedules_count > 0) {
        $stats['scheduled']++;
      } else {
        if (isset($stats[$status])) {
          $stats[$status]++;
        } else {
          $stats['draft']++;
        }
      }
    }

    $stats['total'] = count($publications);
    return $this->successResponse($stats);
  }

  /**
   * Clear publication caches for a workspace
   */
  /**
   * Lock media upload for a publication to prevent concurrent uploads
   */
  public function lockMedia(Request $request, Publication $publication)
  {
    if (!Auth::user()->hasPermission('manage-content', $publication->workspace_id)) {
      return $this->errorResponse('Unauthorized', 403);
    }

    // Lock for 2 hours (enough for large uploads)
    $lockKey = "publication:{$publication->id}:media_lock";
    cache()->put($lockKey, Auth::id(), now()->addHours(2));

    // Force update of modified_at to trigger UI refresh for others if using polling/sockets
    $publication->touch();
    broadcast(new PublicationUpdated($publication))->toOthers();

    return $this->successResponse([], 'Media locked successfully');
  }

  /**
   * Attach uploaded media to a publication
   */
  public function attachMedia(Request $request, Publication $publication)
  {
    if (!Auth::user()->hasPermission('manage-content', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to modify this publication.', 403);
    }

    $request->validate([
      'key' => 'required|string',
      'filename' => 'required|string',
      'mime_type' => 'required|string',
      'size' => 'required|integer',
    ]);

    try {
      Log::info("📤 attachMedia called", [
        'publication_id' => $publication->id,
        'key' => $request->key,
        'filename' => $request->filename,
        'mime_type' => $request->mime_type,
        'size' => $request->size
      ]);

      // Verify S3 file exists before creating database record
      $path = $request->key;
      $pathTrimmed = ltrim($path, '/');
      
      $fileExists = false;
      try {
        if (Storage::disk('s3')->exists($path)) {
          $fileExists = true;
        } elseif (Storage::disk('s3')->exists($pathTrimmed)) {
          $fileExists = true;
          $path = $pathTrimmed;
        }
      } catch (\Exception $s3Error) {
        Log::error('❌ S3 connection error in attachMedia', [
          'error' => $s3Error->getMessage(),
          'path' => $path,
          'publication_id' => $publication->id
        ]);
        return $this->errorResponse('Failed to verify file in storage: ' . $s3Error->getMessage(), 500);
      }

      if (!$fileExists) {
        Log::warning('⚠️ File not found in S3', [
          'path' => $path,
          'pathTrimmed' => $pathTrimmed,
          'publication_id' => $publication->id
        ]);
        return $this->errorResponse('File not found in storage. Please try uploading again.', 404);
      }

      Log::info('✅ S3 file verified', ['path' => $path]);

      // Calculate next order
      // Using generic DB query to avoid loading all models if possible, or use relationship
      $maxOrder = $publication->mediaFiles()->max('order') ?? -1;
      $nextOrder = $maxOrder + 1;

      Log::info("📊 Calculated order", ['max_order' => $maxOrder, 'next_order' => $nextOrder]);

      // Create MediaFile record explicitly
      $mediaFile = MediaFile::create([
        'workspace_id' => $publication->workspace_id,
        'publication_id' => $publication->id, // Redundant if pivot used, but good for direct belonging
        'file_path' => $path,
        'file_name' => $request->filename,
        'file_type' => str_starts_with($request->mime_type, 'video') ? 'video' : 'image',
        'mime_type' => $request->mime_type,
        'size' => $request->size,
        'status' => 'processing',
        'user_id' => Auth::id(), // Ensure user ownership
      ]);

      Log::info('✅ MediaFile created', ['id' => $mediaFile->id, 'status' => $mediaFile->status]);

      // Explicitly attach with pivot data
      $publication->mediaFiles()->attach($mediaFile->id, ['order' => $nextOrder]);

      Log::info('🔗 Media attached to publication', ['media_id' => $mediaFile->id, 'publication_id' => $publication->id, 'order' => $nextOrder]);

      // Dispatch job to verify S3 file and generate thumbnails if needed
      // Passing null as tempPath indicates it's already on S3 (Direct Upload)
      ProcessBackgroundUpload::dispatch($publication, $mediaFile, null);

      Log::info('🚀 ProcessBackgroundUpload job dispatched', ['media_file_id' => $mediaFile->id]);

      // Clear media lock
      cache()->forget("publication:{$publication->id}:media_lock");

      // Clear cache
      $this->clearPublicationCache($publication->workspace_id);

      // Reload publication to include new media and other relationships for broadcast
      $publication->load(['mediaFiles.derivatives', 'scheduled_posts.socialAccount', 'socialPostLogs.socialAccount', 'campaigns']);

      // Broadcast to other users in the workspace
      event(new PublicationUpdated($publication));

      return $this->successResponse(['publication' => $publication], 'Media attached successfully.');
    } catch (\Exception $e) {
      Log::error('❌ Failed to attach media', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
      return $this->errorResponse('Failed to attach media: ' . $e->getMessage(), 500);
    }
  }

  /**
   * Get activities for a publication
   */
  public function activities(Publication $publication)
  {
    if (!Auth::user()->hasPermission('manage-content', $publication->workspace_id) && !Auth::user()->hasPermission('view-content', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to view this publication.', 403);
    }

    $activities = $publication->activities()
      ->with('user:id,name,photo_url')
      ->latest()
      ->paginate(20);

    // Add descriptions to each activity
    $activities->getCollection()->transform(function ($activity) {
      $activity->description = $activity->getDescription();
      $activity->formatted_changes = $activity->getFormattedChanges();
      return $activity;
    });

    return $this->successResponse(['activities' => $activities]);
  }

  /**
   * Valida el contenido de una publicación antes de publicar
   */
  public function validateContent(Request $request, Publication $publication, ContentValidationService $validationService)
  {
    $request->validate([
      'platform_ids' => 'required|array',
      'platform_ids.*' => 'integer|exists:social_accounts,id',
    ]);

    try {
      $result = $validationService->validatePublication(
        $publication,
        $request->input('platform_ids')
      );

      return $this->successResponse($result->toArray());
    } catch (\Exception $e) {
      Log::error('Content validation failed', [
        'publication_id' => $publication->id,
        'error' => $e->getMessage()
      ]);

      return $this->errorResponse('Error al validar el contenido: ' . $e->getMessage(), 500);
    }
  }

  public function export(Request $request)
  {
    $workspaceId = Auth::user()->current_workspace_id;
    
    if (!Auth::user()->hasPermission('manage-content', $workspaceId) && !Auth::user()->hasPermission('view-content', $workspaceId)) {
      return $this->errorResponse('You do not have permission to export publications.', 403);
    }

    $format = $request->input('format', 'xlsx');
    $filters = $request->only(['status', 'search', 'date_start', 'date_end', 'platform']);

    try {
      $export = new \App\Exports\PublicationsExport($filters);
      $filename = 'publicaciones_' . date('Y-m-d_His') . '.' . $format;

      if ($format === 'pdf') {
        return Excel::download($export, $filename, \Maatwebsite\Excel\Excel::DOMPDF);
      }

      return Excel::download($export, $filename);
    } catch (\Exception $e) {
      return $this->errorResponse('Export failed: ' . $e->getMessage(), 500);
    }
  }

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
      }
    }
  }
}
