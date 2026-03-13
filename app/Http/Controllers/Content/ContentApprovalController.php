<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Models\Publications\Publication;
use App\Services\ApprovalWorkflowService;
use App\Http\Requests\ContentApproval\ApproveContentRequest;
use App\Http\Requests\ContentApproval\RejectContentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class ContentApprovalController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ApprovalWorkflowService $approvalWorkflowService
    ) {}

    /**
     * Submit content for approval
     * 
     * POST /api/content/{content}/submit-for-approval
     * 
     * @param Publication $content Route model binding for content parameter
     * @return JsonResponse
     */
    public function submitForApproval(Publication $content): JsonResponse
    {

      Log::info('Submit for approval attempt', [
          'user_id' => Auth::id(),
          'content_id' => $content->id,
          'content_title' => $content->title,
        ]);
        try {
            // Authorize using policy
            Gate::authorize('submitForApproval', $content);

            $user = Auth::user();
            
            $approvalAction = $this->approvalWorkflowService->submitForApproval($content, $user);
            
            // Refresh content to get updated data
            $content = $content->fresh(['workspace.approvalWorkflow.levels.role']);
            
            // Get current approval level info
            $workflow = $content->workspace->approvalWorkflow;
            $currentLevel = $content->current_approval_level;
            $approvalLevel = $workflow?->getLevelByNumber($currentLevel);
            
            // Get approvers for this level
            $approvers = $approvalLevel ? $approvalLevel->getApprovers() : collect();
            $approverNames = $approvers->pluck('name')->toArray();
            
            return $this->successResponse([
                'message' => 'Content submitted for approval successfully.',
                'content' => $content,
                'approval_action' => $approvalAction,
                'approval_info' => [
                    'current_level' => $currentLevel,
                    'level_name' => $approvalLevel?->level_name,
                    'approvers' => $approverNames,
                    'approver_count' => count($approverNames),
                ],
            ], 200);
        } catch (\App\Exceptions\ApprovalWorkflowNotEnabledException $e) {
            return $this->errorResponse('Approval workflow is not enabled for this workspace.', 400);
        } catch (\App\Exceptions\InvalidContentStatusException $e) {
            return $this->errorResponse($e->getMessage(), 400);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->errorResponse('You do not have permission to submit this content for approval.', 403);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to submit content for approval: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Approve content at current approval level
     * 
     * POST /api/content/{content}/approve
     * 
     * @param Publication $content
     * @param ApproveContentRequest $request
     * @return JsonResponse
     */
    public function approve(Publication $content, ApproveContentRequest $request): JsonResponse
    {
        try {
            // Authorize using policy
            Gate::authorize('approve', $content);

            $user = Auth::user();
            $comment = $request->input('comment');
            
            $approvalAction = $this->approvalWorkflowService->approveContent($content, $user, $comment);

            return $this->successResponse([
                'message' => 'Content approved successfully.',
                'content' => $content->fresh(),
                'approval_action' => $approvalAction,
            ], 200);
        } catch (\App\Exceptions\InsufficientPermissionsException $e) {
            return $this->errorResponse($e->getMessage(), 403);
        } catch (\App\Exceptions\InvalidApprovalStateException $e) {
            return $this->errorResponse($e->getMessage(), 400);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->errorResponse('You do not have permission to approve this content.', 403);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to approve content: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reject content and return to creator
     * 
     * POST /api/content/{content}/reject
     * 
     * @param Publication $content
     * @param RejectContentRequest $request
     * @return JsonResponse
     */
    public function reject(Publication $content, RejectContentRequest $request): JsonResponse
    {
        try {
            // Authorize using policy
            Gate::authorize('reject', $content);

            $user = Auth::user();
            $reason = $request->input('reason');
            
            $approvalAction = $this->approvalWorkflowService->rejectContent($content, $user, $reason);

            return $this->successResponse([
                'message' => 'Content rejected successfully.',
                'content' => $content->fresh(),
                'approval_action' => $approvalAction,
            ], 200);
        } catch (\App\Exceptions\InsufficientPermissionsException $e) {
            return $this->errorResponse($e->getMessage(), 403);
        } catch (\App\Exceptions\InvalidApprovalStateException $e) {
            return $this->errorResponse($e->getMessage(), 400);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->errorResponse('You do not have permission to reject this content.', 403);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to reject content: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get current approval status for content
     * 
     * GET /api/content/{content}/approval-status
     * 
     * @param Publication $content
     * @return JsonResponse
     */
    public function approvalStatus(Publication $content): JsonResponse
    {
        try {
            $approvalStatus = $this->approvalWorkflowService->getApprovalStatus($content);

            return $this->successResponse([
                'approval_status' => [
                    'status' => $approvalStatus->status,
                    'current_level' => $approvalStatus->currentLevel,
                    'next_approver_role' => $approvalStatus->nextApproverRole,
                    'last_action' => $approvalStatus->lastAction,
                    'last_action_at' => $approvalStatus->lastActionAt?->toIso8601String(),
                    'last_action_by' => $approvalStatus->lastActionBy,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to retrieve approval status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get approval history for content
     * 
     * GET /api/content/{content}/approval-history
     * 
     * @param Publication $content
     * @return JsonResponse
     */
    public function approvalHistory(Publication $content): JsonResponse
    {
        try {
            $approvalHistory = $this->approvalWorkflowService->getApprovalHistory($content);

            // Format the history for response
            $formattedHistory = $approvalHistory->map(function ($action) {
                return [
                    'id' => $action->id,
                    'action_type' => $action->action_type,
                    'approval_level' => $action->approval_level,
                    'comment' => $action->comment,
                    'created_at' => $action->created_at->toIso8601String(),
                    'user' => [
                        'id' => $action->user->id,
                        'name' => $action->user->name,
                        'email' => $action->user->email,
                        'photo_url' => $action->user->photo_url ?? null,
                    ],
                    'user_role' => $action->user->roles->first()?->display_name ?? 'Unknown',
                ];
            });

            return $this->successResponse([
                'approval_history' => $formattedHistory,
            ], 200);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to retrieve approval history: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get complete approval flow visualization data
     * 
     * GET /api/content/{content}/approval-flow
     * 
     * Returns workflow configuration, all levels with their status,
     * actions history per level, and current user permissions.
     * 
     * @param Publication $content
     * @return JsonResponse
     */
    public function getApprovalFlow(Publication $content): JsonResponse
    {
        try {
            $workspace = $content->workspace;
            $workflow = ApprovalWorkflow::with(['levels.role'])
                ->where('workspace_id', $workspace->id)
                ->first();

            if (!$workflow || !$workflow->is_enabled) {
                return $this->errorResponse('Approval workflow is not enabled for this workspace.', 400);
            }

            $user = Auth::user();
            $userRole = $this->getUserRole($user, $workspace);

            // Get all approval actions grouped by level
            $actions = \App\Models\ApprovalAction::where('content_id', $content->id)
                ->with('user:id,name,email,photo_url')
                ->orderBy('created_at', 'asc')
                ->get()
                ->groupBy('approval_level');

            // Build flow data for each level
            $flowData = $workflow->levels->map(function ($level) use ($content, $actions, $userRole) {
                $levelActions = $actions->get($level->level_number, collect());
                $approvedAction = $levelActions->firstWhere('action_type', \App\Models\ApprovalAction::ACTION_APPROVED);
                $rejectedAction = $levelActions->firstWhere('action_type', \App\Models\ApprovalAction::ACTION_REJECTED);

                $isCurrentLevel = $content->current_approval_level === $level->level_number;
                $isPastLevel = $content->current_approval_level > $level->level_number;
                $isFutureLevel = $content->current_approval_level < $level->level_number;
                
                // User can approve only if:
                // 1. This is the current level
                // 2. User has the required role for this level (or is Owner)
                // 3. Content is in pending_review status
                $canUserApprove = $isCurrentLevel && 
                    $userRole && 
                    ($userRole->slug === \App\Models\Role\Role::OWNER || $userRole->id === $level->role_id) &&
                    $content->status === \App\Models\Publications\Publication::STATUS_PENDING_REVIEW;

                return [
                    'level_number' => $level->level_number,
                    'level_name' => $level->level_name,
                    'role' => [
                        'id' => $level->role->id,
                        'name' => $level->role->name,
                        'display_name' => $level->role->display_name,
                        'slug' => $level->role->slug,
                    ],
                    'is_current_level' => $isCurrentLevel,
                    'is_past_level' => $isPastLevel,
                    'is_future_level' => $isFutureLevel,
                    'approved_action' => $approvedAction ? [
                        'id' => $approvedAction->id,
                        'user' => $approvedAction->user,
                        'comment' => $approvedAction->comment,
                        'created_at' => $approvedAction->created_at->toIso8601String(),
                    ] : null,
                    'rejected_action' => $rejectedAction ? [
                        'id' => $rejectedAction->id,
                        'user' => $rejectedAction->user,
                        'comment' => $rejectedAction->comment,
                        'created_at' => $rejectedAction->created_at->toIso8601String(),
                    ] : null,
                    'can_user_approve' => $canUserApprove,
                    'status' => $this->getLevelStatus($approvedAction, $rejectedAction, $isCurrentLevel, $isPastLevel),
                ];
            });

            return $this->successResponse([
                'workflow' => [
                    'id' => $workflow->id,
                    'is_multi_level' => $workflow->is_multi_level,
                    'total_levels' => $workflow->levels->count(),
                ],
                'flow' => $flowData,
                'publication_status' => $content->status,
                'current_level' => $content->current_approval_level,
                'user_role' => $userRole ? [
                    'id' => $userRole->id,
                    'name' => $userRole->name,
                    'display_name' => $userRole->display_name,
                    'slug' => $userRole->slug,
                ] : null,
            ], 200);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to retrieve approval flow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Determine the status of an approval level
     * 
     * @param mixed $approvedAction
     * @param mixed $rejectedAction
     * @param bool $isCurrentLevel
     * @param bool $isPastLevel
     * @return string
     */
    private function getLevelStatus($approvedAction, $rejectedAction, bool $isCurrentLevel, bool $isPastLevel): string
    {
        if ($approvedAction) {
            return 'approved';
        }
        
        if ($rejectedAction) {
            return 'rejected';
        }
        
        if ($isCurrentLevel) {
            return 'in_review';
        }
        
        if ($isPastLevel) {
            return 'skipped'; // Should not happen in normal flow
        }
        
        return 'pending';
    }

    /**
     * Get user's role in a workspace
     * 
     * @param \App\Models\User $user
     * @param \App\Models\Workspace\Workspace $workspace
     * @return \App\Models\Role\Role|null
     */
    private function getUserRole(\App\Models\User $user, \App\Models\Workspace\Workspace $workspace): ?\App\Models\Role\Role
    {
        $rolePivot = \Illuminate\Support\Facades\DB::table('role_user')
            ->where('user_id', $user->id)
            ->where('workspace_id', $workspace->id)
            ->first();

        if (!$rolePivot) {
            return null;
        }

        return \App\Models\Role\Role::find($rolePivot->role_id);
    }

    /**
     * Publish approved content
     * 
     * POST /api/content/{content}/publish
     * 
     * @param Publication $content
     * @return JsonResponse
     */
    public function publish(Publication $content): JsonResponse
    {
        try {
            // Authorize using policy
            Gate::authorize('publish', $content);

            $user = Auth::user();

            // Check if content can be published
            if (!$this->approvalWorkflowService->canPublish($content, $user)) {
                return $this->errorResponse('Content must be approved before publishing.', 400);
            }

            // Update content status to published
            $content->status = Publication::STATUS_PUBLISHED;
            $content->published_at = now();
            $content->published_by = $user->id;
            $content->save();

            return $this->successResponse([
                'message' => 'Content published successfully.',
                'content' => $content->fresh(),
            ], 200);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->errorResponse('You do not have permission to publish this content.', 403);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to publish content: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Manually resolve approval state (Admin only)
     * 
     * POST /api/content/{content}/manual-resolve
     * 
     * This endpoint allows admins to manually resolve stuck approval workflows.
     * 
     * @param Publication $content
     * @param \Illuminate\Http\Request $request
     * @return JsonResponse
     */
    public function manualResolve(Publication $content, \Illuminate\Http\Request $request): JsonResponse
    {
        try {
            // Authorize using policy - only admins and owners
            Gate::authorize('manualResolve', $content);

            // Validate request
            $validated = $request->validate([
                'action' => 'required|in:approve,reject,advance',
                'reason' => 'required|string|max:500',
                'target_level' => 'nullable|integer|min:0',
            ]);

            $user = Auth::user();
            $action = $validated['action'];
            $reason = $validated['reason'];
            $targetLevel = $validated['target_level'] ?? null;

            // Perform the manual resolution
            $result = $this->performManualResolution($content, $user, $action, $reason, $targetLevel);

            return $this->successResponse([
                'message' => 'Content approval state resolved manually.',
                'content' => $content->fresh(),
                'approval_action' => $result['approval_action'],
            ], 200);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->errorResponse('Only admins can manually resolve approval states.', 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse('Validation failed.', 422, $e->errors());
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to resolve approval state: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Perform manual resolution of approval state
     * 
     * @param Publication $content
     * @param \App\Models\User $admin
     * @param string $action
     * @param string $reason
     * @param int|null $targetLevel
     * 
     * @return array
     */
    private function performManualResolution(
        Publication $content,
        \App\Models\User $admin,
        string $action,
        string $reason,
        ?int $targetLevel
    ): array {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($content, $admin, $action, $reason, $targetLevel) {
            $currentLevel = $content->current_approval_level;

            switch ($action) {
                case 'approve':
                    // Manually approve and mark as approved
                    $content->status = Publication::STATUS_APPROVED;
                    $content->approved_at = now();
                    $content->current_approval_level = 0;
                    break;

                case 'reject':
                    // Manually reject
                    $content->status = 'rejected';
                    $content->rejected_at = now();
                    $content->rejected_by = $admin->id;
                    $content->rejection_reason = $reason;
                    $content->current_approval_level = 0;
                    break;

                case 'advance':
                    // Manually advance to target level or next level
                    if ($targetLevel !== null) {
                        $content->current_approval_level = $targetLevel;
                    } else {
                        $content->current_approval_level = $currentLevel + 1;
                    }
                    
                    // Check if we've reached the end
                    $workflow = \App\Models\ApprovalWorkflow::where('workspace_id', $content->workspace_id)->first();
                    if ($workflow && $workflow->is_multi_level) {
                        $maxLevel = $workflow->getMaxLevel();
                        if ($content->current_approval_level > $maxLevel) {
                            $content->status = Publication::STATUS_APPROVED;
                            $content->approved_at = now();
                            $content->current_approval_level = 0;
                        }
                    }
                    break;
            }

            $content->save();

            // Log the manual resolution
            $approvalAction = \App\Models\ApprovalAction::create([
                'content_id' => $content->id,
                'user_id' => $admin->id,
                'action_type' => \App\Models\ApprovalAction::ACTION_MANUAL_RESOLUTION,
                'approval_level' => $currentLevel,
                'comment' => "Manual resolution by admin: {$action}. Reason: {$reason}",
            ]);

            \Illuminate\Support\Facades\Log::info('Manual approval resolution performed', [
                'content_id' => $content->id,
                'admin_id' => $admin->id,
                'action' => $action,
                'reason' => $reason,
                'old_level' => $currentLevel,
                'new_level' => $content->current_approval_level,
                'new_status' => $content->status,
            ]);

            return [
                'approval_action' => $approvalAction,
            ];
        });
    }
}
