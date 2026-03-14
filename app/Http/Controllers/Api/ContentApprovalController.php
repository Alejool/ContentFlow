<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContentApproval\ApproveContentRequest;
use App\Http\Requests\ContentApproval\RejectContentRequest;
use App\Models\Publications\Publication;
use App\Services\ApprovalWorkflowService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentApprovalController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ApprovalWorkflowService $approvalWorkflowService
    ) {}

    /**
     * Submit content for approval
     * 
     * POST /api/content/{content}/submit-for-approval
     */
    public function submit(Request $request, $contentId): JsonResponse
    {
        try {
            $content = Publication::withoutGlobalScope('workspace')->findOrFail($contentId);

            // Check authorization
            $this->authorize('submitForApproval', $content);

            // Submit for approval
            $action = $this->approvalWorkflowService->submitForApproval(
                $content,
                $request->user()
            );

            return $this->successResponse(
                [
                    'content_id' => $content->id,
                    'status' => $content->status,
                    'current_approval_level' => $content->current_approval_level,
                    'action_id' => $action->id,
                ],
                'Content submitted for approval successfully',
                200
            );
        } catch (\App\Exceptions\ApprovalWorkflowNotEnabledException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\App\Exceptions\InvalidContentStatusException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to submit content: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Approve content
     * 
     * POST /api/content/{content}/approve
     */
    public function /approve
(ApproveContentRequest $request, $contentId): JsonResponse
    {
        try {
            $content = Publication::withoutGlobalScope('workspace')->findOrFail($contentId);

            // Check authorization
            $this->authorize('approve', $content);

            // Approve content
            $action = $this->approvalWorkflowService->approveContent(
                $content,
                $request->user(),
                $request->comment
            );

            return $this->successResponse(
                [
                    'content_id' => $content->id,
                    'status' => $content->status,
                    'current_approval_level' => $content->current_approval_level,
                    'action_id' => $action->id,
                ],
                'Content approved successfully',
                200
            );
        } catch (\App\Exceptions\InsufficientPermissionsException $e) {
            return $this->errorResponse($e->getMessage(), 403);
        } catch (\App\Exceptions\InvalidApprovalStateException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to approve content: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reject content
     * 
     * POST /api/content/{content}/reject
     */
    public function reject(RejectContentRequest $request, $contentId): JsonResponse
    {
        try {
            $content = Publication::withoutGlobalScope('workspace')->findOrFail($contentId);

            // Check authorization
            $this->authorize('reject', $content);

            // Reject content
            $action = $this->approvalWorkflowService->rejectContent(
                $content,
                $request->user(),
                $request->reason
            );

            return $this->successResponse(
                [
                    'content_id' => $content->id,
                    'status' => $content->status,
                    'current_approval_level' => $content->current_approval_level,
                    'action_id' => $action->id,
                ],
                'Content rejected successfully',
                200
            );
        } catch (\App\Exceptions\InsufficientPermissionsException $e) {
            return $this->errorResponse($e->getMessage(), 403);
        } catch (\App\Exceptions\InvalidApprovalStateException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to reject content: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get approval status for content
     * 
     * GET /api/content/{content}/approval-status
     */
    public function status(Request $request, $contentId): JsonResponse
    {
        try {
            $content = Publication::withoutGlobalScope('workspace')->findOrFail($contentId);

            // Get approval status
            $status = $this->approvalWorkflowService->getApprovalStatus($content);

            return $this->successResponse([
                'content_id' => $content->id,
                'status' => $status->status,
                'current_level' => $status->currentLevel,
                'next_approver_role' => $status->nextApproverRole,
                'last_action' => $status->lastAction,
                'last_action_at' => $status->lastActionAt?->toIso8601String(),
                'last_action_by' => $status->lastActionBy,
                'is_pending' => $status->isPending(),
                'is_complete' => $status->isComplete(),
                'requires_action' => $status->requiresAction(),
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve approval status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get approval history for content
     * 
     * GET /api/content/{content}/approval-history
     */
    public function history(Request $request, $contentId): JsonResponse
    {
        try {
            $content = Publication::withoutGlobalScope('workspace')->findOrFail($contentId);

            // Get approval history
            $history = $this->approvalWorkflowService->getApprovalHistory($content);

            return $this->successResponse([
                'content_id' => $content->id,
                'history' => $history->map(function ($action) {
                    return [
                        'id' => $action->id,
                        'action_type' => $action->action_type,
                        'approval_level' => $action->approval_level,
                        'comment' => $action->comment,
                        'user' => [
                            'id' => $action->user->id,
                            'name' => $action->user->name,
                        ],
                        'created_at' => $action->created_at->toIso8601String(),
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve approval history: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Publish approved content
     * 
     * POST /api/content/{content}/publish
     */
    public function publish(Request $request, $contentId): JsonResponse
    {
        try {
            $content = Publication::withoutGlobalScope('workspace')->findOrFail($contentId);

            // Check authorization
            $this->authorize('publish', $content);

            // Check if content can be published
            if (!$this->approvalWorkflowService->canPublish($content, $request->user())) {
                return $this->errorResponse('Content must be approved before publishing', 422);
            }

            // Update content status to published
            $content->update([
                'status' => 'published',
                'published_by' => $request->user()->id,
                'published_at' => now(),
            ]);

            return $this->successResponse(
                [
                    'content_id' => $content->id,
                    'status' => $content->status,
                    'published_at' => $content->published_at->toIso8601String(),
                ],
                'Content published successfully',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to publish content: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Manually resolve approval state (Admin only)
     * 
     * POST /api/content/{content}/manual-resolve
     */
    public function manualResolve(Request $request, $contentId): JsonResponse
    {
        try {
            $content = Publication::withoutGlobalScope('workspace')->findOrFail($contentId);

            // Check authorization - must be admin or owner
            $this->authorize('manualResolve', $content);

            // Validate request
            $validated = $request->validate([
                'action' => 'required|in:approve,reject,advance',
                'reason' => 'required|string|max:500',
                'target_level' => 'nullable|integer|min:0',
            ]);

            $action = $validated['action'];
            $reason = $validated['reason'];
            $targetLevel = $validated['target_level'] ?? null;

            // Perform the manual resolution
            $result = $this->performManualResolution($content, $request->user(), $action, $reason, $targetLevel);

            return $this->successResponse(
                [
                    'content_id' => $content->id,
                    'status' => $content->fresh()->status,
                    'current_approval_level' => $content->fresh()->current_approval_level,
                    'action_id' => $result['action_id'],
                ],
                'Content approval state resolved manually',
                200
            );
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->errorResponse('Only admins can manually resolve approval states', 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse('Validation failed: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to resolve approval state: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Perform manual resolution of approval state
     * 
     * @param Publication $content
     * @param User $admin
     * @param string $action
     * @param string $reason
     * @param int|null $targetLevel
     * 
     * @return array
     */
    private function performManualResolution(
        Publication $content,
        User $admin,
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
                'action_type' => 'manual_resolution',
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
                'action_id' => $approvalAction->id,
            ];
        });
    }
}
