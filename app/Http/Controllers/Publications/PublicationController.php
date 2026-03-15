<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Traits\HasTimezone;
use Illuminate\Http\Request;
use App\Models\Publications\Publication;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use App\Http\Requests\Publications\StorePublicationRequest;
use App\Http\Requests\Publications\UpdatePublicationRequest;
use App\Actions\Publications\CreatePublicationAction;
use App\Actions\Publications\UpdatePublicationAction;
use App\Actions\Publications\PublishPublicationAction;
use App\Actions\Publications\UnpublishPublicationAction;
use App\Actions\Publications\DeletePublicationAction;
use App\Events\Publications\PublicationUpdated;
use App\Events\PublicationStatusUpdated;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

use App\Models\Social\ScheduledPost;
use App\Models\Social\SocialPostLog;
use App\Models\Logs\ApprovalLog;
use App\Models\Role\Role;
use App\Models\User;
use App\Jobs\ProcessBackgroundUpload;
use App\Models\Workspace\Workspace;
use App\Models\Social\SocialAccount;
use App\Models\ApprovalLevel;
use App\Models\ApprovalWorkflow;
use App\Models\MediaFiles\MediaFile;
use App\Models\Publications\PublicationLock;
use App\Services\Validation\ContentValidationService;
use App\Services\Subscription\PlanLimitValidator;
use App\Services\Publications\ContentTypeValidationService;
use Maatwebsite\Excel\Facades\Excel;

class PublicationController extends Controller
{
  use ApiResponse, HasTimezone;

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
          'scheduled_posts' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'scheduled_at', 'is_recurring_instance'),
          'scheduled_posts.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
          'socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'platform', 'status', 'post_url'),
          'campaigns' => fn($q) => $q->select('campaigns.id', 'campaigns.name', 'campaigns.status'),
          'user' => fn($q) => $q->select('users.id', 'users.name', 'users.email', 'users.photo_url'),
          'publisher' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
          'rejector' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
          'currentApprovalStep' => fn($q) => $q->with([
            'role:id,name,slug',
            'user:id,name,photo_url',
            'workflow' => fn($wq) => $wq->with([
              'steps' => fn($sq) => $sq->with([
                'role:id,name,slug',
                'user:id,name,photo_url'
              ])->orderBy('level_number')
            ])
          ]),
          'approvalLogs' => fn($q) => $q->latest('created_at')->with([
            'user:id,name,photo_url',
            'approvalStep:id,level_number,level_name,role_id,user_id'
          ]),
          'approvalRequest' => fn($q) => $q->with([
            'currentStep:id,level_number,level_name',
            'workflow' => fn($wq) => $wq->with([
              'levels' => fn($lq) => $lq->orderBy('level_number')->with([
                'role:id,name,slug',
                'user:id,name,photo_url'
              ])
            ])
          ]),
          'activities' => fn($q) => $q->orderBy('created_at', 'desc')->with('user:id,name,photo_url'),
          'recurrenceSettings', // Load recurrence settings
        ]);

      // Status filtering with smart defaults
      if ($request->has('status') && $request->status !== 'all') {
        $statuses = explode(',', $request->status);
        $query->whereIn('status', $statuses);
      } elseif (!$request->has('status')) {
        // No status filter at all: exclude pending_review by default
        // (they appear in the Approvals tab instead)
        $query->where('status', '!=', 'pending_review');
      }
      // status=all: no filter applied, show everything including pending_review

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

      if ($request->has('content_type') && !empty($request->content_type)) {
        $contentTypes = $request->input('content_type', []);
        if (!is_array($contentTypes)) {
          $contentTypes = [$contentTypes];
        }
        // Filter out 'all' value if present
        $contentTypes = array_filter($contentTypes, fn($type) => $type !== 'all');
        if (!empty($contentTypes)) {
          $query->whereIn('content_type', $contentTypes);
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

      // Filter approval logs for each publication to show only current request
      if ($publications instanceof \Illuminate\Pagination\LengthAwarePaginator) {
        $publications->getCollection()->each(function($publication) {
          $this->filterApprovalLogsForCurrentRequest($publication);
        });
      } else {
        $publications->each(function($publication) {
          $this->filterApprovalLogsForCurrentRequest($publication);
        });
      }

      return $this->successResponse(['publications' => $publications]);
    });
  }

  public function store(StorePublicationRequest $request, CreatePublicationAction $action)
  {
    $workspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;
    if (!Auth::user()->hasPermission('manage-content', $workspaceId)) {
      return $this->errorResponse('You do not have permission to create publications.', 403);
    }

    // Plan limit check: only enforce when trying to publish or schedule directly
    $intendedStatus = $request->input('status', 'draft');
    if (in_array($intendedStatus, ['published', 'scheduled', 'publishing'])) {
      $workspace = Auth::user()->workspaces()->find($workspaceId);
      if ($workspace) {
        $validator = app(PlanLimitValidator::class);
        if (!$validator->canPerformAction($workspace, 'publications')) {
          $upgradeMsg = $validator->getUpgradeMessage($workspace, 'publications');
          return $this->errorResponse($upgradeMsg['message'], 402, array_merge($upgradeMsg, ['limit_type' => 'publications']));
        }
      }
    }

    try {
      $data = $request->validated();
      // Normalize scheduled_at to UTC using user's timezone
      if (!empty($data['scheduled_at'])) {
        if (!Auth::user()->hasPermission('publish', $workspaceId)) {
          // User cannot schedule, so we ignore the scheduled_at date and force draft
          unset($data['scheduled_at']);
          $data['status'] = 'draft';
        } else {
          try {
            $data['scheduled_at'] = $this->toUTC($data['scheduled_at'])->toIso8601String();
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

  public function show(Request $request, $publicationId)
  {
    // Manually resolve publication to provide better error messages
    $publication = Publication::withoutGlobalScope('workspace')->find($publicationId);

    if (!$publication) {
      return $this->errorResponse('Publication not found.', 404);
    }

    // Check if publication belongs to current workspace
    $currentWorkspaceId = Auth::user()->current_workspace_id ?? Auth::user()->workspaces()->first()?->id;

    // Verify user has access to the publication's workspace
    $userWorkspaceIds = Auth::user()->workspaces()->pluck('workspaces.id')->toArray();
    if (!in_array($publication->workspace_id, $userWorkspaceIds)) {
      return $this->errorResponse('You do not have access to this publication.', 403);
    }

    // If publication is from a different workspace, inform the user
    if ($publication->workspace_id !== $currentWorkspaceId) {
      return $this->errorResponse('This publication belongs to a different workspace. Please switch to the correct workspace to view it.', 403);
    }

    // Check permissions - allow if user has manage-content, view-content, OR is the publication creator
    $hasPermission = Auth::user()->hasPermission('manage-content', $publication->workspace_id)
      || Auth::user()->hasPermission('view-content', $publication->workspace_id)
      || $publication->user_id === Auth::id();

    if (!$hasPermission) {
      return $this->errorResponse('You do not have permission to view this publication.', 403);
    }

    $publication->load([
      'mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name', 'media_files.size', 'media_files.mime_type'),
      'mediaFiles.thumbnail' => fn($q) => $q->select('id', 'media_file_id', 'file_path', 'file_name', 'derivative_type'),
      'mediaFiles.derivatives' => fn($q) => $q->select('id', 'media_file_id', 'file_path', 'file_name', 'derivative_type', 'size', 'width', 'height'),
      'scheduled_posts' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'scheduled_at', 'is_recurring_instance'),
      'scheduled_posts.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
      'socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'platform', 'status', 'post_url', 'published_at', 'error_message'),
      'socialPostLogs.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
      'campaigns' => fn($q) => $q->select('campaigns.id', 'campaigns.name', 'campaigns.status'),
      'publisher' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
      'rejector' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
      'currentApprovalStep' => fn($q) => $q->with([
        'role:id,name,slug',
        'user:id,name,photo_url',
        'workflow' => fn($wq) => $wq->with([
          'steps' => fn($sq) => $sq->with([
            'role:id,name,slug',
            'user:id,name,photo_url'
          ])->orderBy('level_number')
        ])
      ]),
      'approvalLogs' => fn($q) => $q->latest('created_at')->with(['user:id,name,photo_url', 'approvalStep:id,level_number,level_name']),
      'approvalRequest' => fn($q) => $q->with([
        'currentStep:id,level_number,level_name',
        'workflow' => fn($wq) => $wq->with([
          'levels' => fn($lq) => $lq->orderBy('level_number')->with([
            'role:id,name,slug',
            'user:id,name,photo_url'
          ])
        ])
      ]),
      'activities' => fn($q) => $q->orderBy('created_at', 'desc')->with('user:id,name,photo_url'),
      'recurrenceSettings', // Load recurrence settings
    ]);

    // Filter approval_logs to show only logs from the current approval_request
    // This prevents showing old logs from previous approval cycles
    $this->filterApprovalLogsForCurrentRequest($publication);

    // Debug: Log if recurrenceSettings is loaded
    \Log::info('Publication show - recurrenceSettings loaded', [
      'publication_id' => $publication->id,
      'has_recurrence_settings' => $publication->relationLoaded('recurrenceSettings'),
      'recurrence_settings_data' => $publication->recurrenceSettings?->toArray(),
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

    // Get approval workflow information
    $workspace = $publication->workspace;
    $workflow = $workspace->approvalWorkflow()->with(['levels.role', 'levels.user'])->first();
    $approvalWorkflowInfo = null;
    
    if ($workflow && $workflow->is_enabled) {
      // Get approval request to determine current level
      $approvalRequest = $publication->approvalRequest;
      $currentLevel = 0;
      
      \Log::info('Building approval workflow info', [
        'publication_id' => $publication->id,
        'publication_status' => $publication->status,
        'approval_request_exists' => $approvalRequest ? true : false,
        'approval_request_status' => $approvalRequest?->status,
        'approval_request_current_step_id' => $approvalRequest?->current_step_id,
      ]);
      
      // If publication is approved, all levels are completed
      if ($publication->status === 'approved') {
        $currentLevel = $workflow->levels->max('level_number') ?? 0;
        \Log::info('Publication is approved, setting current_level to max', [
          'current_level' => $currentLevel,
        ]);
      } 
      // If there's a pending approval request with current step
      elseif ($approvalRequest && $approvalRequest->status === 'pending' && $approvalRequest->current_step_id) {
        $currentStep = \App\Models\ApprovalLevel::find($approvalRequest->current_step_id);
        $currentLevel = $currentStep ? $currentStep->level_number : 0;
        \Log::info('Using approval_request current_step_id', [
          'current_step_id' => $approvalRequest->current_step_id,
          'current_level' => $currentLevel,
        ]);
      }
      
      $approvalWorkflowInfo = [
        'id' => $workflow->id,
        'name' => $workflow->name ?? 'Flujo de Aprobación',
        'is_enabled' => true,
        'is_multi_level' => $workflow->is_multi_level,
        'current_level' => $currentLevel,
        'max_level' => $workflow->levels->max('level_number') ?? 1,
        'levels' => $workflow->levels->map(function($level) {
          return [
            'id' => $level->id,
            'level_number' => $level->level_number,
            'level_name' => $level->level_name,
            'role' => $level->role ? [
              'id' => $level->role->id,
              'name' => $level->role->name,
              'slug' => $level->role->slug,
            ] : null,
            'user' => $level->user ? [
              'id' => $level->user->id,
              'name' => $level->user->name,
              'photo_url' => $level->user->photo_url,
            ] : null,
          ];
        })->toArray(),
        'status_info' => [
          'current_status' => $publication->status,
          'can_submit_for_approval' => in_array($publication->status, ['draft', 'rejected']),
          'is_pending_review' => $publication->status === 'pending_review',
          'is_approved' => $publication->status === 'approved',
          'is_rejected' => $publication->status === 'rejected',
          'next_action' => $this->getNextApprovalAction($publication, $workflow),
        ],
      ];
      
      \Log::info('Final approval workflow info', [
        'current_level' => $approvalWorkflowInfo['current_level'],
        'max_level' => $approvalWorkflowInfo['max_level'],
      ]);
    }

    // Append to publication object (dynamically)
    $publication->media_locked_by = $mediaLockedBy;
    $publication->approval_lock = $approvalLock;
    $publication->approval_workflow = $approvalWorkflowInfo;

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
      
      Log::info('PublicationController@update: Data received', [
        'publication_id' => $publication->id,
        'scheduled_at_received' => $data['scheduled_at'] ?? 'NOT SET',
        'current_db_scheduled_at' => $publication->scheduled_at,
        'social_account_schedules' => $data['social_account_schedules'] ?? $data['account_schedules'] ?? 'NOT SET',
      ]);

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

      // Normalize scheduled_at to UTC using user's timezone
      if (!empty($data['scheduled_at'])) {
        try {
          Log::info('PublicationController: Normalizing scheduled_at', [
            'original' => $data['scheduled_at'],
            'user_timezone' => $this->getUserTimezone(),
          ]);
          
          $data['scheduled_at'] = $this->toUTC($data['scheduled_at'])->toIso8601String();
          
          Log::info('PublicationController: Normalized scheduled_at', [
            'normalized' => $data['scheduled_at'],
          ]);
        } catch (\Exception $e) {
          Log::error('PublicationController: Error normalizing scheduled_at', [
            'error' => $e->getMessage(),
          ]);
          // leave as-is
        }
      } else {
        Log::info('PublicationController: scheduled_at is empty', [
          'scheduled_at' => $data['scheduled_at'] ?? 'NOT SET',
        ]);
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
    \Log::info('=== PUBLISH METHOD STARTED ===', [
      'publication_id' => $publication->id,
      'status' => $publication->status,
      'user_id' => auth()->id(),
    ]);

    // Check payload size to prevent 413 errors
    $contentLength = $request->header('Content-Length');
    if ($contentLength && $contentLength > 10 * 1024 * 1024) { // 10MB limit for publish request
      return $this->errorResponse(
        'Request payload too large. Please reduce the amount of data being sent.',
        413
      );
    }

    // Check permissions using Policy (respects approval workflow)
    try {
      \Illuminate\Support\Facades\Gate::authorize('publish', $publication);
      \Log::info('=== GATE AUTHORIZED ===', ['publication_id' => $publication->id]);
    } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
      \Log::warning('=== GATE DENIED ===', [
        'publication_id' => $publication->id,
        'error' => $e->getMessage()
      ]);
      // If authorization failed, return error
      // Note: The Policy already handles workflow and owner checks
      return $this->errorResponse('You do not have permission to publish this content.', 403);
    }

    // Validar límites de contenido según estado de verificación de cuentas
    $platformIds = $request->input('platforms', []);
    if (!empty($platformIds)) {
      $limitsService = app(\App\Services\Validation\SocialMediaLimitsService::class);
      $validation = $limitsService->validatePublication($publication, $platformIds);
      
      if (!$validation['can_publish']) {
        $friendlyMessage = $limitsService->getClientFriendlyMessage($validation);
        $recommendations = $limitsService->generateRecommendations($publication, $platformIds);
        
        return $this->errorResponse(
          $friendlyMessage,
          422,
          [
            'validation_errors' => $validation['results'],
            'recommendations' => $recommendations,
          ]
        );
      }
    }

    // Check if user is owner (can bypass workflow)
    $isOwner = false;
    $role = null;
    $userRole = auth()->user()->workspaces()
      ->where('workspaces.id', $publication->workspace_id)
      ->first();
    
    if ($userRole && $userRole->pivot->role_id) {
      $role = \App\Models\Role\Role::find($userRole->pivot->role_id);
      $isOwner = $role && $role->slug === \App\Models\Role\Role::OWNER;
    }

    \Log::info('PublicationController::publish - Checking canBePublished', [
      'publication_id' => $publication->id,
      'publication_status' => $publication->status,
      'isOwner' => $isOwner,
      'user_id' => auth()->id(),
      'role_slug' => $role ? $role->slug : 'NULL',
    ]);

    // Verify publication status allows publishing
    $canPublish = $publication->canBePublished($isOwner);
    
    \Log::info('PublicationController::publish - canBePublished result', [
      'publication_id' => $publication->id,
      'canPublish' => $canPublish,
      'isOwner' => $isOwner,
    ]);

    if (!$canPublish) {
      // If pending review, show specific message
      if ($publication->status === 'pending_review') {
        return $this->errorResponse(
          __('publications.errors.pending_review'),
          422,
          ['current_status' => $publication->status]
        );
      }

      // If publishing or retrying, check if it's for the SAME platforms
      if (in_array($publication->status, ['publishing', 'retrying'])) {
        $requestedPlatforms = $request->input('platforms', []);
        
        // Get platforms currently being published
        $publishingPlatforms = \App\Models\SocialPostLog::where('publication_id', $publication->id)
          ->whereIn('status', ['pending', 'publishing'])
          ->whereIn('id', function ($query) use ($publication) {
            $query->selectRaw('MAX(id)')
              ->from('social_post_logs')
              ->where('publication_id', $publication->id)
              ->groupBy('social_account_id');
          })
          ->pluck('social_account_id')
          ->toArray();
        
        // Check if any requested platform is currently being published
        $conflictingPlatforms = array_intersect($requestedPlatforms, $publishingPlatforms);
        
        if (!empty($conflictingPlatforms)) {
          return $this->errorResponse(
            __('publications.errors.already_publishing'),
            422,
            [
              'current_status' => $publication->status,
              'conflicting_platforms' => $conflictingPlatforms
            ]
          );
        }
        
        // If no conflicts, allow publishing to other platforms
      }

      // Check if needs approval (but not if already publishing/retrying to different platforms)
      if (!in_array($publication->status, ['publishing', 'retrying'])) {
        \Log::warning('PublicationController::publish - Blocking publication', [
          'publication_id' => $publication->id,
          'status' => $publication->status,
          'isOwner' => $isOwner,
          'canPublish' => $canPublish,
        ]);
        
        return $this->errorResponse(
          __('publications.errors.not_approved'),
          422,
          ['current_status' => $publication->status]
        );
      }
    }

    try {
      $platformSettings = $request->input('platform_settings');
      if (is_string($platformSettings)) {
        $platformSettings = json_decode($platformSettings, true) ?? [];
      }

      $action->execute($publication, $request->input('platforms'), [
        'thumbnails' => $request->file('thumbnails', []),
        'platform_settings' => $platformSettings
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
    $currentWorkspaceId = Auth::user()->current_workspace_id;

    // Verify publication belongs to current workspace
    if ($workspaceId !== $currentWorkspaceId) {
      return $this->errorResponse('This publication does not belong to your current workspace.', 403);
    }

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

    // Duplicated publications start as draft so no limit check needed here.
    // Limit is enforced when the user publishes or schedules the duplicated publication.

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
    // Simple check: user must have publish permission
    if (!Auth::user()->hasPermission('publish', $publication->workspace_id)) {
      return $this->errorResponse('You do not have permission to submit content for approval. You need publish permission.', 403);
    }

    // Use PublicationFlowService to validate
    $flowService = app(\App\Services\PublicationFlowService::class);
    
    try {
      $flowService->validateCanRequestReview($publication, Auth::user());
    } catch (\Exception $e) {
      return $this->errorResponse($e->getMessage(), 422, [
        'is_owner' => $flowService->isOwner(Auth::user(), $publication->workspace),
        'should_use_publish' => $flowService->canPublishDirectly(Auth::user(), $publication->workspace),
      ]);
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

    // Check for active workflow
    $workflow = ApprovalWorkflow::with('levels')
      ->where('workspace_id', $publication->workspace_id)
      ->where('is_enabled', true)
      ->orderBy('created_at', 'desc')
      ->first();

    \Log::info('Checking for workflow', [
      'publication_id' => $publication->id,
      'workspace_id' => $publication->workspace_id,
      'has_workflow' => !!$workflow,
      'workflow_id' => $workflow?->id,
      'is_enabled' => $workflow?->is_enabled,
      'levels_count' => $workflow?->levels->count() ?? 0,
    ]);

    $currentStepId = null;
    $hasWorkflow = $workflow && $workflow->levels && $workflow->levels->isNotEmpty();
    
    \Log::info('Workflow check result', [
      'hasWorkflow' => $hasWorkflow,
      'will_use_engine' => $hasWorkflow ? 'YES' : 'NO',
    ]);
    
    if ($hasWorkflow) {
      $currentStepId = $workflow->levels->first()->id;
    }

    $publication->update($updateData + ['current_approval_step_id' => $currentStepId]);

    // CRITICAL: Create ApprovalRequest based on workflow existence
    if ($hasWorkflow) {
      // Use ApprovalWorkflowEngine for multi-level workflow
      \Log::info('Using ApprovalWorkflowEngine for multi-level workflow');
      $approvalEngine = app(\App\Services\Approval\ApprovalWorkflowEngine::class);
      try {
        $approvalRequest = $approvalEngine->submitForApproval($publication, Auth::user());
        
        \Log::info('ApprovalRequest created from requestReview (with workflow)', [
          'publication_id' => $publication->id,
          'request_id' => $approvalRequest->id,
        ]);
      } catch (\Exception $e) {
        \Log::error('Failed to create ApprovalRequest with workflow', [
          'publication_id' => $publication->id,
          'error' => $e->getMessage(),
          'trace' => $e->getTraceAsString(),
        ]);
        return $this->errorResponse('Failed to submit for approval: ' . $e->getMessage(), 500);
      }
    } else {
      // Create simple approval request (no workflow)
      // This allows non-Admin/Owner users to submit for approval even without workflow
      \Log::info('Creating simple approval request (no workflow)', [
        'publication_id' => $publication->id,
        'user_id' => Auth::id(),
        'workspace_id' => $publication->workspace_id,
      ]);
      
      try {
        $approvalRequest = \App\Models\Approval\ApprovalRequest::create([
          'publication_id' => $publication->id,
          'workflow_id' => null, // No workflow
          'current_step_id' => null,
          'status' => \App\Models\Approval\ApprovalRequest::STATUS_PENDING,
          'submitted_by' => Auth::id(),
          'submitted_at' => now(),
          'metadata' => [
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'simple_approval' => true, // Flag to indicate this is a simple approval
            'note' => 'Simple approval request - no workflow configured',
          ],
        ]);

        // Create initial log entry
        \App\Models\Logs\ApprovalLog::create([
          'approval_request_id' => $approvalRequest->id,
          'approval_step_id' => null,
          'user_id' => Auth::id(),
          'action' => \App\Models\Logs\ApprovalLog::ACTION_SUBMITTED,
          'level_number' => 0,
          'comment' => 'Publication submitted for simple approval (no workflow)',
          'metadata' => [
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'simple_approval' => true,
          ],
        ]);

        \Log::info('Simple ApprovalRequest created successfully (no workflow)', [
          'publication_id' => $publication->id,
          'request_id' => $approvalRequest->id,
        ]);
      } catch (\Exception $e) {
        \Log::error('Failed to create simple ApprovalRequest', [
          'publication_id' => $publication->id,
          'error' => $e->getMessage(),
        ]);
        // Continue even if approval request creation fails
      }
    }

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
      $approver->notify(new \App\Notifications\PublicationAwaitingApprovalNotification($publication, Auth::user()));
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

    // Reload publication with all relationships for response
    $publication->load([
      'user:id,name,email,photo_url',
      'currentApprovalStep' => fn($q) => $q->with([
        'role:id,name',
        'user:id,name,photo_url',
        'workflow.steps' => fn($q) => $q->orderBy('level_number')->with(['role:id,name', 'user:id,name,photo_url'])
      ]),
      'approvalLogs' => fn($q) => $q->latest('created_at')->with([
        'user:id,name,photo_url',
        'approvalStep' => fn($q) => $q->with(['role:id,name', 'user:id,name,photo_url'])
      ])
    ]);

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
      Log::warning('Approve failed: Publication is not in pending_review', [
        'publication_id' => $publication->id,
        'current_status' => $publication->status,
        'user_id' => Auth::id(),
        'workspace_id' => $publication->workspace_id,
        'current_workspace_id' => Auth::user()->current_workspace_id
      ]);
      return $this->errorResponse('Only publications in pending review can be approved.', 422);
    }

    $request->validate([
      'comment' => 'nullable|string|max:500',
    ]);

    $latestLog = $publication->approvalLogs()
      ->latest('created_at')
      ->first();

    // Get the approval request to use its current_step_id (source of truth)
    $approvalRequest = $publication->approvalRequest;
    
    if (!$approvalRequest || $approvalRequest->status !== 'pending') {
      return $this->errorResponse('No pending approval request found for this publication.', 422);
    }

    // Check if this is a simple approval (no workflow)
    $isSimpleApproval = !$approvalRequest->current_step_id && !$approvalRequest->workflow_id;
    
    if ($isSimpleApproval) {
      // For simple approvals, only Admin and Owner can approve
      $userRole = DB::table('role_user')
        ->join('roles', 'roles.id', '=', 'role_user.role_id')
        ->where('role_user.workspace_id', $publication->workspace_id)
        ->where('role_user.user_id', Auth::id())
        ->select('roles.slug')
        ->first();
      
      $isAdminOrOwner = $userRole && in_array($userRole->slug, ['owner', 'admin']);
      
      if (!$isAdminOrOwner) {
        \Log::warning('User cannot approve simple approval - not Admin or Owner', [
          'user_id' => Auth::id(),
          'user_role' => $userRole?->slug ?? 'none',
          'publication_id' => $publication->id,
        ]);
        return $this->errorResponse('Only Admin and Owner can approve publications when no workflow is configured.', 403);
      }
      
      \Log::info('Simple approval - Admin/Owner can approve', [
        'user_id' => Auth::id(),
        'user_role' => $userRole->slug,
        'publication_id' => $publication->id,
      ]);
    }

    // Multi-level logic - use approval_request.current_step_id as source of truth
    if ($approvalRequest->current_step_id) {
      $currentStep = ApprovalLevel::find($approvalRequest->current_step_id);

      // Permission check for this specific step
      $canApproveThisStep = false;
      
      // Check if user is directly assigned to this step
      if ($currentStep->user_id && $currentStep->user_id === Auth::id()) {
        $canApproveThisStep = true;
        \Log::info('User directly assigned to step', [
          'user_id' => Auth::id(),
          'step_id' => $currentStep->id,
          'step_user_id' => $currentStep->user_id,
        ]);
      } 
      // Check if user's role matches the step's role
      elseif ($currentStep->role_id) {
        // Find user role in this workspace
        $userRole = DB::table('role_user')
          ->where('workspace_id', $publication->workspace_id)
          ->where('user_id', Auth::id())
          ->first();
        
        \Log::info('Checking role assignment', [
          'user_id' => Auth::id(),
          'step_role_id' => $currentStep->role_id,
          'user_role_id' => $userRole?->role_id ?? null,
        ]);
        
        if ($userRole && $userRole->role_id === $currentStep->role_id) {
          $canApproveThisStep = true;
        }
      } 
      // If step has neither user_id nor role_id, fallback to general permission
      else {
        $canApproveThisStep = true;
        \Log::info('Step has no specific assignment, using general permission', [
          'user_id' => Auth::id(),
          'step_id' => $currentStep->id,
        ]);
      }

      if (!$canApproveThisStep) {
        // Check if user is owner or admin as fallback
        $userRole = DB::table('role_user')
          ->where('workspace_id', $publication->workspace_id)
          ->where('user_id', Auth::id())
          ->first();
        $isOwnerOrAdmin = $userRole && in_array($userRole->role_id, [1, 2]); // Assuming 1=Owner, 2=Admin
        
        \Log::warning('User cannot approve this step', [
          'user_id' => Auth::id(),
          'step_id' => $currentStep->id,
          'step_user_id' => $currentStep->user_id,
          'step_role_id' => $currentStep->role_id,
          'user_role_id' => $userRole?->role_id ?? null,
          'is_owner_or_admin' => $isOwnerOrAdmin,
        ]);
        
        if (!$isOwnerOrAdmin) {
          return $this->errorResponse('You do not have permission to approve this specific step.', 403);
        }
      }

      // Check if this user already approved this step
      $alreadyApproved = \App\Models\Logs\ApprovalLog::where('approval_request_id', $approvalRequest->id)
        ->where('approval_step_id', $currentStep->id)
        ->where('user_id', Auth::id())
        ->where('action', 'approved')
        ->exists();

      if ($alreadyApproved) {
        return $this->errorResponse('You have already approved this step.', 422);
      }

      // Find next step
      $nextStep = ApprovalLevel::where('approval_workflow_id', $currentStep->approval_workflow_id)
        ->where('level_number', '>', $currentStep->level_number)
        ->orderBy('level_number', 'asc')
        ->first();

      if ($nextStep) {
        // Create approval log for this step (new schema)
        \App\Models\Logs\ApprovalLog::create([
          'approval_request_id' => $approvalRequest->id,
          'approval_step_id' => $currentStep->id,
          'user_id' => Auth::id(),
          'action' => 'approved',
          'level_number' => $currentStep->level_number,
          'comment' => $request->input('comment'),
        ]);

        $publication->update([
          'current_approval_step_id' => $nextStep->id,
          'current_approval_level' => $nextStep->level_number,
        ]);

        // Update approval_request current_step_id
        $approvalRequest->update(['current_step_id' => $nextStep->id]);

        $publication->logActivity('step_approved', [
          'step_name' => $currentStep->level_name ?? "Nivel {$currentStep->level_number}",
          'approver' => Auth::user()->name,
          'next_step' => $nextStep->level_name ?? "Nivel {$nextStep->level_number}",
        ]);

        $this->clearPublicationCache(Auth::user()->current_workspace_id);

        // Dispatch event for notifications
        if ($approvalRequest) {
          event(new \App\Events\Approval\ApprovalStepCompleted(
            $approvalRequest,
            $currentStep,
            $nextStep
          ));
          
          \Log::info('ApprovalStepCompleted event dispatched from PublicationController', [
            'publication_id' => $publication->id,
            'from_step' => $currentStep->id,
            'to_step' => $nextStep->id,
          ]);
        }

        // Load all necessary relationships for the response
        $publication->load([
          'currentApprovalStep' => fn($q) => $q->with([
            'role:id,name',
            'user:id,name,photo_url',
            'workflow.steps' => fn($q) => $q->orderBy('level_number')->with(['role:id,name', 'user:id,name,photo_url'])
          ]),
          'approvalLogs' => fn($q) => $q->latest('created_at')->with([
            'user:id,name,photo_url',
            'approvalStep' => fn($q) => $q->with(['role:id,name', 'user:id,name,photo_url'])
          ])
        ]);

        // CRITICAL: Broadcast specific event for approval level advancement
        // This is different from PublicationUpdated to avoid confusion
        broadcast(new \App\Events\Approval\ApprovalLevelAdvanced(
          $publication,
          $currentStep,
          $nextStep
        ))->toOthers();
        
        \Log::info('ApprovalLevelAdvanced broadcast sent', [
          'publication_id' => $publication->id,
          'from_level' => $currentStep->level_number,
          'to_level' => $nextStep->level_number,
          'workspace_id' => $publication->workspace_id,
        ]);

        return $this->successResponse([
          'publication' => $publication,
        ], 'Step approved. Publication moved to ' . ($nextStep->level_name ?? "the next step") . '.');
      }
    }

    // If no more steps or no workflow, mark as fully approved
    // Check if this user already approved this final step
    if ($approvalRequest->current_step_id) {
      $currentStep = ApprovalLevel::find($approvalRequest->current_step_id);
      $alreadyApproved = \App\Models\Logs\ApprovalLog::where('approval_request_id', $approvalRequest->id)
        ->where('approval_step_id', $currentStep->id)
        ->where('user_id', Auth::id())
        ->where('action', 'approved')
        ->exists();

      if ($alreadyApproved) {
        return $this->errorResponse('You have already approved this step.', 422);
      }

      // Create approval log for final step (new schema)
      \App\Models\Logs\ApprovalLog::create([
        'approval_request_id' => $approvalRequest->id,
        'approval_step_id' => $currentStep->id,
        'user_id' => Auth::id(),
        'action' => 'approved',
        'level_number' => $currentStep->level_number,
        'comment' => $request->input('comment'),
      ]);
    } else {
      // Simple approval (no workflow) - create log entry
      \App\Models\Logs\ApprovalLog::create([
        'approval_request_id' => $approvalRequest->id,
        'approval_step_id' => null,
        'user_id' => Auth::id(),
        'action' => 'approved',
        'level_number' => 1, // Simple approval is level 1
        'comment' => $request->input('comment') ?? 'Simple approval - no workflow configured',
        'metadata' => [
          'simple_approval' => true,
          'ip' => request()->ip(),
          'user_agent' => request()->userAgent(),
        ],
      ]);
      
      \Log::info('Simple approval log created', [
        'approval_request_id' => $approvalRequest->id,
        'user_id' => Auth::id(),
        'publication_id' => $publication->id,
      ]);
    }

    $publication->update([
      'status' => 'approved',
      'current_approval_step_id' => null,
      'current_approval_level' => 0, // Reset to 0 when fully approved
      'approved_by' => Auth::id(),
      'approved_at' => now(),
      'approved_retries_remaining' => 3,
      'rejected_by' => null,
      'rejected_at' => null,
      'rejection_reason' => null,
    ]);

    // Update approval_request to approved status
    $approvalRequest->update([
      'status' => 'approved',
      'completed_at' => now(),
      'completed_by' => Auth::id(),
      'current_step_id' => null,
    ]);

    if ($latestLog) {
      // Legacy log update skipped - new schema handled above
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
      $publication->user->notify(new \App\Notifications\PublicationApprovedNotification($publication, Auth::user()));
    }

    // Broadcast lock removal to notify all users in real-time (publication is now editable)
    broadcast(new \App\Events\Publications\PublicationLockChanged(
      $publication->id,
      null, // No lock - publication can be edited (will revert to pending if edited)
      $publication->workspace_id
    ))->toOthers();

    broadcast(new PublicationUpdated($publication))->toOthers();

    // Load approver relationship and logs for response
    $publication->load([
      'approvedBy:id,name,email', 
      'approvalLogs' => fn($q) => $q->latest('created_at')->with([
        'user:id,name,photo_url',
        'approvalStep' => fn($q) => $q->with(['role:id,name', 'user:id,name,photo_url'])
      ]),
      'currentApprovalStep' => fn($q) => $q->with([
        'role:id,name',
        'user:id,name,photo_url',
        'workflow.steps' => fn($q) => $q->orderBy('level_number')->with(['role:id,name', 'user:id,name,photo_url'])
      ])
    ]);

    // Filter approval logs to show only current request
    $this->filterApprovalLogsForCurrentRequest($publication);

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
      Log::warning('Reject failed: Publication is not in pending_review', [
        'publication_id' => $publication->id,
        'current_status' => $publication->status,
        'user_id' => Auth::id(),
        'workspace_id' => $publication->workspace_id,
        'current_workspace_id' => Auth::user()->current_workspace_id
      ]);
      return $this->errorResponse('Only publications in pending review can be rejected.', 422);
    }

    $request->validate([
      'rejection_reason' => 'required|string|min:10|max:500',
    ], [
      'rejection_reason.required' => __('validation.rejection_reason_required'),
      'rejection_reason.min' => __('validation.rejection_reason_min'),
      'rejection_reason.max' => __('validation.rejection_reason_max'),
    ]);

    // Check if this user already rejected this step
    $approvalRequestForReject = $publication->approvalRequest;
    if ($publication->current_approval_step_id && $approvalRequestForReject) {
      $currentStep = ApprovalLevel::find($publication->current_approval_step_id);
      $alreadyRejected = \App\Models\Logs\ApprovalLog::where('approval_request_id', $approvalRequestForReject->id)
        ->where('approval_step_id', $currentStep->id)
        ->where('user_id', Auth::id())
        ->where('action', 'rejected')
        ->exists();

      if ($alreadyRejected) {
        return $this->errorResponse('You have already rejected this publication.', 422);
      }

      // Create approval log for rejection (new schema)
      \App\Models\Logs\ApprovalLog::create([
        'approval_request_id' => $approvalRequestForReject->id,
        'approval_step_id' => $currentStep->id,
        'user_id' => Auth::id(),
        'action' => 'rejected',
        'level_number' => $currentStep->level_number,
        'comment' => $request->input('rejection_reason'),
      ]);
    }

    // Reject and unlock by changing status to draft
    $publication->update([
      'status' => 'draft',
      'rejected_by' => Auth::id(),
      'rejected_at' => now(),
      'rejection_reason' => $request->input('rejection_reason'),
      'approved_by' => null,
      'approved_at' => null,
      'approved_retries_remaining' => 2,
      'current_approval_step_id' => null, // Reset workflow
    ]);

    $latestLog = $publication->approvalLogs()
      ->latest('created_at')
      ->first();

    if ($latestLog) {
      // Legacy log update skipped - new schema handled above
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
      $publication->user->notify(new \App\Notifications\PublicationRejectedNotification($publication, Auth::user()));
    }

    // Broadcast lock removal to notify all users in real-time
    broadcast(new \App\Events\Publications\PublicationLockChanged(
      $publication->id,
      null, // No lock
      $publication->workspace_id
    ))->toOthers();

    broadcast(new PublicationUpdated($publication))->toOthers();

    // Load rejector relationship for response
    $publication->load(['rejectedBy:id,name,email', 'approvalLogs' => fn($q) => $q->latest('created_at')->with(['user:id,name,photo_url'])]);

    // Filter approval logs to show only current request
    $this->filterApprovalLogsForCurrentRequest($publication);

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

      // Cancel only specific platforms - mark as failed and clear retry flags
      $updated = $publication->socialPostLogs()
        ->whereIn('social_account_id', $platformIds)
        ->whereIn('status', ['pending', 'publishing', 'failed'])
        ->update([
          'status' => 'failed',
          'error_message' => 'Cancelado por el usuario',
          'is_retrying' => false,
          'retry_started_at' => null,
          'updated_at' => now(),
        ]);

      \Log::info('Updated social post logs', ['count' => $updated, 'platform_ids' => $platformIds]);

      // Try to delete specific platform jobs from queue - improved query
      try {
        foreach ($platformIds as $platformId) {
          // Delete from jobs table
          $deletedJobs = \Illuminate\Support\Facades\DB::table('jobs')
            ->where('payload', 'like', '%PublishToSocialMedia%')
            ->where('payload', 'like', '%"publicationId":' . $publication->id . '%')
            ->where(function ($query) use ($platformId) {
              $query->where('payload', 'like', '%"socialAccountIds":[' . $platformId . ']%')
                ->orWhere('payload', 'like', '%"socialAccountIds":[' . $platformId . ',%')
                ->orWhere('payload', 'like', '%"socialAccountIds":,%' . $platformId . '%');
            })
            ->delete();

          // Delete from failed_jobs table
          $deletedFailedJobs = \Illuminate\Support\Facades\DB::table('failed_jobs')
            ->where('payload', 'like', '%PublishToSocialMedia%')
            ->where('payload', 'like', '%"publicationId":' . $publication->id . '%')
            ->where(function ($query) use ($platformId) {
              $query->where('payload', 'like', '%"socialAccountIds":[' . $platformId . ']%')
                ->orWhere('payload', 'like', '%"socialAccountIds":[' . $platformId . ',%')
                ->orWhere('payload', 'like', '%"socialAccountIds":,%' . $platformId . '%');
            })
            ->delete();

          \Log::info('Deleted queued jobs for platform', [
            'platform_id' => $platformId,
            'deleted_jobs' => $deletedJobs,
            'deleted_failed_jobs' => $deletedFailedJobs,
          ]);
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

    // Actualizar logs de redes sociales - clear retry flags
    $publication->socialPostLogs()
      ->whereIn('status', ['pending', 'publishing', 'failed'])
      ->update([
        'status' => 'failed',
        'error_message' => 'Cancelado por el usuario',
        'is_retrying' => false,
        'retry_started_at' => null,
        'updated_at' => now(),
      ]);

    // Eliminar jobs pendientes de la cola - improved query
    try {
      $deletedJobs = \Illuminate\Support\Facades\DB::table('jobs')
        ->where('payload', 'like', '%PublishToSocialMedia%')
        ->where('payload', 'like', '%"publicationId":' . $publication->id . '%')
        ->delete();

      $deletedFailedJobs = \Illuminate\Support\Facades\DB::table('failed_jobs')
        ->where('payload', 'like', '%PublishToSocialMedia%')
        ->where('payload', 'like', '%"publicationId":' . $publication->id . '%')
        ->delete();

      \Log::info('Deleted all queued jobs for publication', [
        'publication_id' => $publication->id,
        'deleted_jobs' => $deletedJobs,
        'deleted_failed_jobs' => $deletedFailedJobs,
      ]);
    } catch (\Exception $e) {
      \Log::warning("Could not delete queued jobs for publication {$publication->id}: " . $e->getMessage());
    }

    $publication->logActivity('cancelled', ['previous_status' => $oldStatus]);

    $publication->user->notify(new \App\Notifications\PublicationCancelledNotification($publication));

    if ($publication->workspace && ($publication->workspace->discord_webhook_url || $publication->workspace->slack_webhook_url)) {
      $publication->workspace->notify(new \App\Notifications\PublicationCancelledNotification($publication));
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

    // Get current active social accounts for this workspace
    $activeAccountIds = SocialAccount::where('workspace_id', Auth::user()->current_workspace_id)
      ->whereNull('deleted_at')
      ->pluck('id')
      ->toArray();

    $latestLogs = SocialPostLog::where('publication_id', $publication->id)
      ->select('social_account_id', 'status', 'retry_count', 'is_retrying')
      ->whereIn('id', function ($query) use ($publication) {
        $query->selectRaw('MAX(id)')
          ->from('social_post_logs')
          ->where('publication_id', $publication->id)
          ->groupBy('social_account_id');
      })
      ->get();

    $statusGroups = ['published' => [], 'failed' => [], 'publishing' => [], 'removed_platforms' => []];
    $retryInfo = [];

    foreach ($latestLogs as $log) {
      // Skip logs for accounts that no longer exist or are disconnected
      // UNLESS the status is 'published', 'success', or 'removed_on_platform' (we want to show these as "removed_platforms")
      if (!in_array($log->social_account_id, $activeAccountIds)) {
        if (in_array($log->status, ['published', 'success', 'removed_on_platform'])) {
          // Mark as removed platform so UI can show it was published elsewhere
          $statusGroups['removed_platforms'][] = $log->social_account_id;
        }
        continue;
      }

      $status = $log->status === 'removed_on_platform' ? 'removed_platforms' : $log->status;

      if ($status === 'pending') $status = 'publishing';

      if (isset($statusGroups[$status])) {
        $statusGroups[$status][] = $log->social_account_id;
      }

      // Add retry information
      if ($log->is_retrying || $log->retry_count > 0) {
        $retryInfo[$log->social_account_id] = [
          'retry_count' => $log->retry_count,
          'is_retrying' => $log->is_retrying,
          'retry_status' => sprintf('%d/3', $log->is_retrying ? $log->retry_count + 1 : $log->retry_count),
        ];
      }
    }

    // Get accounts that are already published or successfully posted
    $publishedAccountIds = array_merge(
      $statusGroups['published'],
      $statusGroups['removed_platforms']
    );

    // Get scheduled account IDs - ONLY original posts, not recurring instances
    // Exclude accounts that are already published (based on social_post_logs)
    $scheduledAccountIds = ScheduledPost::where('publication_id', $publication->id)
      ->where('status', 'pending')
      ->where('is_recurring_instance', false) // Only original posts
      ->whereNotIn('social_account_id', $publishedAccountIds) // Exclude already published
      ->pluck('social_account_id')
      ->unique()
      ->values()
      ->toArray();
    
    // Get recurring posts grouped by account (for display in UI)
    $recurringPosts = ScheduledPost::where('publication_id', $publication->id)
      ->where('is_recurring_instance', true)
      ->orderBy('social_account_id')
      ->orderBy('scheduled_at')
      ->get()
      ->groupBy('social_account_id')
      ->map(function ($posts) {
        return $posts->map(function ($post) {
          return [
            'id' => $post->id,
            'scheduled_at' => $post->scheduled_at,
            'status' => $post->status,
            'social_account_id' => $post->social_account_id,
          ];
        });
      })
      ->toArray();
    
    // Get published recurring posts (with links from social_post_logs)
    $publishedRecurringPosts = SocialPostLog::where('publication_id', $publication->id)
      ->where('status', 'published')
      ->whereIn('scheduled_post_id', function ($query) use ($publication) {
        $query->select('id')
          ->from('scheduled_posts')
          ->where('publication_id', $publication->id)
          ->where('is_recurring_instance', true);
      })
      ->get()
      ->groupBy('social_account_id')
      ->map(function ($logs) {
        return $logs->map(function ($log) {
          return [
            'id' => $log->id,
            'published_at' => $log->published_at,
            'post_url' => $log->post_url,
            'social_account_id' => $log->social_account_id,
            'scheduled_post_id' => $log->scheduled_post_id,
          ];
        });
      })
      ->toArray();

    return response()->json([
      'published_platforms' => array_values(array_unique($statusGroups['published'])),
      'failed_platforms' => array_values(array_unique($statusGroups['failed'])),
      'publishing_platforms' => array_values(array_unique($statusGroups['publishing'])),
      'removed_platforms' => array_values(array_unique($statusGroups['removed_platforms'])),
      'scheduled_platforms' => $scheduledAccountIds,
      'retry_info' => $retryInfo,
      'recurring_posts' => $recurringPosts,
      'published_recurring_posts' => $publishedRecurringPosts,
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
  /**
   * Auto-suggest content type for publication based on video duration
   */
  private function autoSuggestContentTypeForPublication(Publication $publication, float $duration, MediaFile $mediaFile): void
  {
    try {
      $contentTypeService = app(\App\Services\Publications\ContentTypeValidationService::class);
      $currentType = $publication->content_type;
      
      $mediaFileData = [
        'duration' => $duration,
        'mime_type' => $mediaFile->mime_type,
        'type' => $mediaFile->mime_type
      ];
      
      $suggestedType = $contentTypeService->suggestContentTypeByDuration($mediaFileData, $currentType);
      
      if ($suggestedType !== $currentType) {
        Log::info('Auto-suggesting content type change', [
          'publication_id' => $publication->id,
          'current_type' => $currentType,
          'suggested_type' => $suggestedType,
          'duration' => $duration
        ]);
        
        // Update publication content type
        $publication->update(['content_type' => $suggestedType]);
        
        // Log the change
        $publication->logActivity('content_type_auto_changed', [
          'from' => $currentType,
          'to' => $suggestedType,
          'reason' => "Video duration ({$duration}s) suggests {$suggestedType} format",
          'media_file_id' => $mediaFile->id
        ]);
        
        Log::info('Content type automatically changed', [
          'publication_id' => $publication->id,
          'from' => $currentType,
          'to' => $suggestedType,
          'duration' => $duration
        ]);
      }
    } catch (\Exception $e) {
      Log::error('Failed to auto-suggest content type', [
        'error' => $e->getMessage(),
        'publication_id' => $publication->id,
        'media_file_id' => $mediaFile->id
      ]);
    }
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
      'duration' => 'nullable|numeric|min:0',
      'width' => 'nullable|integer|min:1',
      'height' => 'nullable|integer|min:1',
      'aspect_ratio' => 'nullable|numeric|min:0',
    ]);

    try {
      Log::info("📤 attachMedia called", [
        'publication_id' => $publication->id,
        'key' => $request->key,
        'filename' => $request->filename,
        'mime_type' => $request->mime_type,
        'size' => $request->size,
        'duration' => $request->duration,
        'width' => $request->width,
        'height' => $request->height,
        'aspect_ratio' => $request->aspect_ratio,
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
      $metadata = [];
      if ($request->has('duration')) {
        $metadata['duration'] = $request->duration;
      }
      if ($request->has('width')) {
        $metadata['width'] = $request->width;
      }
      if ($request->has('height')) {
        $metadata['height'] = $request->height;
      }
      if ($request->has('aspect_ratio')) {
        $metadata['aspect_ratio'] = $request->aspect_ratio;
      }

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
        'metadata' => $metadata,
      ]);

      Log::info('✅ MediaFile created', ['id' => $mediaFile->id, 'status' => $mediaFile->status]);

      // Explicitly attach with pivot data
      $publication->mediaFiles()->attach($mediaFile->id, ['order' => $nextOrder]);

      Log::info('🔗 Media attached to publication', ['media_id' => $mediaFile->id, 'publication_id' => $publication->id, 'order' => $nextOrder]);

      // Dispatch job to verify S3 file and generate thumbnails if needed
      // Passing null as tempPath indicates it's already on S3 (Direct Upload)
      ProcessBackgroundUpload::dispatch($publication, $mediaFile, null);

      Log::info('🚀 ProcessBackgroundUpload job dispatched', ['media_file_id' => $mediaFile->id]);

      // Auto-suggest content type based on duration if it's a video and we have duration
      if ($mediaFile->file_type === 'video' && isset($metadata['duration']) && $metadata['duration'] > 0) {
        Log::info('🎯 Auto-suggesting content type based on video duration', [
          'publication_id' => $publication->id,
          'media_file_id' => $mediaFile->id,
          'duration' => $metadata['duration'],
          'current_type' => $publication->content_type
        ]);
        $this->autoSuggestContentTypeForPublication($publication, $metadata['duration'], $mediaFile);
      } else {
        Log::info('⏭️ Skipping content type auto-suggestion', [
          'publication_id' => $publication->id,
          'media_file_id' => $mediaFile->id,
          'file_type' => $mediaFile->file_type,
          'has_duration' => isset($metadata['duration']),
          'duration_value' => $metadata['duration'] ?? 'null',
          'metadata' => $metadata
        ]);
      }

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



  public function export(Request $request)
  {
    $workspaceId = Auth::user()->current_workspace_id;

    if (!Auth::user()->hasPermission('manage-content', $workspaceId) && !Auth::user()->hasPermission('view-content', $workspaceId)) {
      return $this->errorResponse('You do not have permission to export publications.', 403);
    }

    $format = $request->input('format', 'xlsx');
    $filters = $request->only(['status', 'search', 'date_start', 'date_end', 'platform']);

    try {
      // Get workspace and history limit info
      $workspace = Auth::user()->currentWorkspace ?? Auth::user()->workspaces()->first();
      $validator = app(\App\Services\Subscription\GranularLimitValidator::class);
      $historyDays = $validator->getHistoryDaysLimit($workspace);
      $startDate = $validator->getExportStartDate($workspace);
      $endDate = now();
      
      $export = new \App\Exports\PublicationsExport($filters);
      
      // Generate descriptive filename with date range and plan limit
      $startDateStr = $startDate->format('Y-m-d');
      $endDateStr = $endDate->format('Y-m-d');
      $filename = "publicaciones_{$startDateStr}_{$endDateStr}_{$historyDays}dias.{$format}";

      // Add metadata header for CSV/XLSX
      if ($format === 'csv' || $format === 'xlsx') {
        // The export class will handle the date filtering
        $response = Excel::download($export, $filename);
        
        // Add custom header with export info
        $response->headers->set('X-Export-History-Days', $historyDays);
        $response->headers->set('X-Export-Start-Date', $startDate->format('Y-m-d'));
        
        return $response;
      }

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

  /**
   * Valida el contenido de una publicación contra las plataformas seleccionadas
   * antes de publicar (para mostrar advertencias en el frontend)
   */
  public function validateContent(Request $request, Publication $publication)
  {
    $workspaceId = Auth::user()->current_workspace_id;
    
    if (!Auth::user()->hasPermission('manage-content', $workspaceId)) {
      return $this->errorResponse('You do not have permission to validate content.', 403);
    }

    $platformIds = $request->input('platforms', []);
    
    if (empty($platformIds)) {
      return $this->errorResponse('No platforms selected for validation.', 422);
    }

    $limitsService = app(\App\Services\Validation\SocialMediaLimitsService::class);
    $validation = $limitsService->validatePublication($publication, $platformIds);
    $recommendations = $limitsService->generateRecommendations($publication, $platformIds);

    return $this->successResponse([
      'can_publish' => $validation['can_publish'],
      'validation_results' => $validation['results'],
      'recommendations' => $recommendations,
      'message' => $validation['can_publish'] 
        ? 'El contenido cumple con todos los requisitos' 
        : $limitsService->getClientFriendlyMessage($validation),
    ]);
  }
  /**
   * Validate publication for publishing with content type compatibility
   */
  public function validatePublish(Request $request, Publication $publication)
  {
    $workspaceId = Auth::user()->current_workspace_id;

    if (!Auth::user()->hasPermission('manage-content', $workspaceId)) {
      return $this->errorResponse('You do not have permission to validate content.', 403);
    }

    $platformIds = $request->input('platform_ids', []);

    if (empty($platformIds)) {
      return $this->errorResponse('No platforms selected for validation.', 422);
    }

    $publishValidationService = app(\App\Services\Validation\PublishValidationService::class);
    $validation = $publishValidationService->validatePublishRequest($publication, $platformIds);

    return $this->successResponse($validation);
  }

  /**
   * Suggest optimal content type based on media files
   *
   * @param Request $request
   * @return \Illuminate\Http\JsonResponse
   */
  public function suggestContentType(Request $request)
  {
    $request->validate([
      'media' => 'nullable|array',
      'current_type' => 'nullable|string|in:post,reel,story,carousel,poll',
    ]);

    $mediaFiles = $request->input('media', []);
    $currentType = $request->input('current_type');

    $validationService = app(ContentTypeValidationService::class);
    $suggestedType = $validationService->suggestContentType($mediaFiles, $currentType);

    return $this->successResponse([
      'suggested_type' => $suggestedType,
      'current_type' => $currentType,
      'should_change' => $suggestedType !== $currentType,
    ], 'Content type suggestion generated');
  }

  /**
   * Get the publication action available for the current user.
   * Returns whether the user can 'publish' directly or must 'review'.
   */
  public function getPublicationAction(Request $request)
  {
    $user = Auth::user();
    $workspaceId = $user->current_workspace_id;
    
    if (!$workspaceId) {
      return $this->errorResponse('No workspace selected', 400);
    }

    $workspace = Workspace::find($workspaceId);
    
    if (!$workspace) {
      return $this->errorResponse('Workspace not found', 404);
    }

    $flowService = app(\App\Services\PublicationFlowService::class);
    $action = $flowService->getPublicationAction($user, $workspace);
    $canBypassWorkflow = $flowService->canPublishDirectly($user, $workspace);
    $isOwner = $flowService->isOwner($user, $workspace);
    
    // Get workflow status
    $workflow = $workspace->approvalWorkflow;
    $workflowEnabled = $workflow && $workflow->is_enabled;

    return $this->successResponse([
      'action' => $action, // 'publish' or 'review'
      'can_bypass_workflow' => $canBypassWorkflow,
      'is_owner' => $isOwner,
      'workflow_enabled' => $workflowEnabled,
      'button_text' => $action === 'publish' ? 'Publicar' : 'Enviar a revisión',
      'button_text_en' => $action === 'publish' ? 'Publish' : 'Send to Review',
      'description' => $action === 'publish' 
        ? 'Puedes publicar contenido directamente sin aprobación'
        : 'Debes enviar el contenido a revisión antes de publicar',
    ]);
  }


  /**
   * Get the next action for the approval workflow
   */
  private function getNextApprovalAction(Publication $publication, ApprovalWorkflow $workflow): string
  {
    $status = $publication->status;
    
    // Si está en draft o rejected, puede enviar a revisión
    if (in_array($status, ['draft', 'rejected'])) {
      return 'submit_for_approval';
    }
    
    // Si está en pending_review, está esperando aprobación
    if ($status === 'pending_review') {
      $currentLevel = $publication->current_approval_level ?? 1;
      $maxLevel = $workflow->levels->max('level_number') ?? 1;
      
      if ($currentLevel < $maxLevel) {
        return 'awaiting_level_' . $currentLevel . '_approval';
      }
      return 'awaiting_final_approval';
    }
    
    // Si está approved, puede publicar
    if ($status === 'approved') {
      return 'ready_to_publish';
    }
    
    return 'unknown';
  }

  /**
   * Get publications pending approval for the current user
   * Can show either:
   * - Publications the user can approve (type=to_approve) - DEFAULT
   * - Publications the user submitted for approval (type=my_requests)
   * 
   * @param Request $request
   * @return \Illuminate\Http\JsonResponse
   */
  public function pendingApprovals(Request $request)
  {
    /** @var User $user */
    $user = Auth::user();
    $workspaceId = $user->current_workspace_id ?? $user->workspaces()->first()?->id;

    if (!$workspaceId) {
      return $this->errorResponse('No active workspace found.', 404);
    }

    $workspace = Workspace::find($workspaceId);
    if (!$workspace) {
      return $this->errorResponse('Workspace not found.', 404);
    }

    // Determinar qué tipo de lista mostrar
    $type = $request->query('type', 'to_approve'); // 'to_approve' o 'my_requests'

    // Si es 'my_requests', mostrar solo las que el usuario envió
    if ($type === 'my_requests') {
      $publications = Publication::where('workspace_id', $workspaceId)
        ->where('status', 'pending_review')
        ->where('user_id', $user->id) // Solo las que YO envié
        ->whereHas('approvalRequest', function ($q) {
          $q->where('status', 'pending');
        })
        ->with([
          'mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name'),
          'currentApprovalStep' => fn($q) => $q->with(['role', 'workflow']),
          'approvalRequest' => fn($q) => $q->with(['currentStep.role', 'currentStep.user', 'logs.user']),
        ])
        ->orderBy('updated_at', 'desc')
        ->get();

      \Log::info('pendingApprovals - My requests', [
        'user_id' => $user->id,
        'workspace_id' => $workspaceId,
        'type' => 'my_requests',
        'count' => $publications->count(),
      ]);

      return $this->successResponse([
        'publications' => $publications,
        'type' => 'my_requests',
        'count' => $publications->count(),
      ]);
    }

    // Si es 'to_approve', mostrar las que puede aprobar (lógica original)
    // Get user's role in the workspace
    $userRole = $user->workspaces()
      ->where('workspaces.id', $workspaceId)
      ->first()
      ?->pivot
      ?->role;

    // Check if user is owner or admin
    $isOwner = $workspace->created_by === $user->id;
    $isAdmin = $userRole && in_array($userRole->slug, ['owner', 'admin']);

    // Get the active approval workflow
    $workflow = $workspace->approvalWorkflow()->with('levels.role')->where('is_enabled', true)->first();

    // Base query: Get publications with pending approval_requests
    // IMPORTANTE: Excluir publicaciones del usuario actual (no puede aprobar su propio contenido)
    $query = Publication::where('workspace_id', $workspaceId)
      ->where('status', 'pending_review')
      ->where('user_id', '!=', $user->id) // No puede aprobar su propio contenido
      ->whereHas('approvalRequest', function ($q) {
        $q->where('status', 'pending');
      })
      ->with([
        'mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name'),
        'user' => fn($q) => $q->select('users.id', 'users.name', 'users.email', 'users.photo_url'),
        'currentApprovalStep' => fn($q) => $q->with(['role', 'workflow']),
        'approvalRequest' => fn($q) => $q->with(['currentStep.role', 'currentStep.user', 'submitter', 'logs.user']),
      ]);

    \Log::info('pendingApprovals - To approve query setup', [
      'user_id' => $user->id,
      'workspace_id' => $workspaceId,
      'is_owner' => $isOwner,
      'is_admin' => $isAdmin,
      'user_role' => $userRole?->slug ?? 'none',
      'has_workflow' => $workflow ? true : false,
    ]);

    // If there's NO workflow OR user is owner/admin, show ALL pending publications
    if (!$workflow || $isAdmin) {
      // Exclude publications already approved by this user
      $query->whereDoesntHave('approvalRequest', function ($q) use ($user) {
        $q->where('status', 'pending')
          ->whereHas('logs', function ($logQ) use ($user) {
            $logQ->where('user_id', $user->id)
              ->where('action', 'approved');
          });
      });
      
      $publications = $query->orderBy('updated_at', 'desc')->get();
      
      return $this->successResponse([
        'publications' => $publications,
        'type' => 'to_approve',
        'filter_type' => $isAdmin ? 'admin_all' : 'no_workflow',
        'user_role' => $userRole?->slug ?? 'member',
      ]);
    }

    // If there IS a workflow, filter by user's assigned level
    $userRoleId = $userRole?->id;
    
    if (!$userRoleId) {
      return $this->successResponse([
        'publications' => [],
        'type' => 'to_approve',
        'filter_type' => 'no_role',
        'user_role' => null,
      ]);
    }

    // Filter by current step assigned to user's role or directly to user
    $query->whereHas('approvalRequest', function ($q) use ($userRoleId, $user) {
      $q->where('status', 'pending')
        ->whereHas('currentStep', function ($stepQuery) use ($userRoleId, $user) {
          $stepQuery->where(function ($assignQuery) use ($userRoleId, $user) {
            $assignQuery->where('role_id', $userRoleId)
              ->orWhere('user_id', $user->id);
          });
        });
    })
    // Exclude publications already approved by this user at the CURRENT step
    ->whereDoesntHave('approvalRequest', function ($q) use ($user) {
      $q->where('status', 'pending')
        ->whereHas('logs', function ($logQ) use ($user) {
          $logQ->where('user_id', $user->id)
            ->where('action', 'approved')
            ->whereColumn('approval_step_id', 'approval_requests.current_step_id');
        });
    });

    $publications = $query->orderBy('updated_at', 'desc')->get();

    \Log::info('pendingApprovals - To approve results', [
      'user_id' => $user->id,
      'publications_count' => $publications->count(),
    ]);

    return $this->successResponse([
      'publications' => $publications,
      'type' => 'to_approve',
      'filter_type' => 'workflow_filtered',
      'user_role' => $userRole->slug,
    ]);
  }

  /**
   * Filter approval logs to show only those from the current approval request.
   * This prevents showing old logs from previous approval cycles.
   */
  private function filterApprovalLogsForCurrentRequest($publication): void
  {
    $approvalRequest = $publication->approvalRequest;
    if ($approvalRequest && $publication->relationLoaded('approvalLogs')) {
      $publication->setRelation('approvalLogs', 
        $publication->approvalLogs->filter(function($log) use ($approvalRequest) {
          return $log->approval_request_id === $approvalRequest->id;
        })
      );
    }
  }
}
