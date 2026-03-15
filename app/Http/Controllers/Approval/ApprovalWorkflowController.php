<?php

namespace App\Http\Controllers\Approval;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Models\Publications\Publication;
use App\Models\Approval\ApprovalRequest;
use App\Services\Approval\ApprovalWorkflowEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class ApprovalWorkflowController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ApprovalWorkflowEngine $engine
    ) {}

    /**
     * Submit publication for approval
     * 
     * POST /api/v1/approvals/submit
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function submit(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'publication_id' => 'required|exists:publications,id',
            ]);

            $publication = Publication::findOrFail($validated['publication_id']);
            
            // Authorize
            Gate::authorize('submitForApproval', $publication);

            $user = Auth::user();
            
            // Check if there's an enabled workflow
            $workflow = $publication->workspace->approvalWorkflow;
            $hasWorkflow = $workflow && $workflow->is_enabled && $workflow->levels && $workflow->levels->isNotEmpty();
            
            if ($hasWorkflow) {
                // Use ApprovalWorkflowEngine for multi-level workflow
                $approvalRequest = $this->engine->submitForApproval($publication, $user);
            } else {
                // Create simple approval request (no workflow)
                \Log::info('Creating simple approval request (no workflow) - ApprovalWorkflowController', [
                    'publication_id' => $publication->id,
                    'user_id' => $user->id,
                ]);
                
                // Update publication status
                $publication->update([
                    'status' => 'pending_review',
                    'rejected_by' => null,
                    'rejected_at' => null,
                    'rejection_reason' => null,
                    'current_approval_step_id' => null,
                ]);
                
                // Create simple approval request
                $approvalRequest = \App\Models\Approval\ApprovalRequest::create([
                    'publication_id' => $publication->id,
                    'workflow_id' => null,
                    'current_step_id' => null,
                    'status' => \App\Models\Approval\ApprovalRequest::STATUS_PENDING,
                    'submitted_by' => $user->id,
                    'submitted_at' => now(),
                    'metadata' => [
                        'ip' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'simple_approval' => true,
                        'note' => 'Simple approval request - no workflow configured',
                    ],
                ]);
                
                // Create initial log entry
                \App\Models\Logs\ApprovalLog::create([
                    'approval_request_id' => $approvalRequest->id,
                    'approval_step_id' => null,
                    'user_id' => $user->id,
                    'action' => \App\Models\Logs\ApprovalLog::ACTION_SUBMITTED,
                    'level_number' => 0,
                    'comment' => 'Publication submitted for simple approval (no workflow)',
                    'metadata' => [
                        'ip' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'simple_approval' => true,
                    ],
                ]);
                
                \Log::info('Simple ApprovalRequest created successfully (no workflow) - ApprovalWorkflowController', [
                    'publication_id' => $publication->id,
                    'request_id' => $approvalRequest->id,
                ]);
            }

            // CRITICAL: Clear publication cache to ensure frontend gets updated data
            // When publication status changes to pending_review, the cache must be invalidated
            // so that the next API call returns the updated list without the submitted publication
            $this->clearPublicationCache($publication->workspace_id);

            return $this->successResponse([
                'message' => 'Publication submitted for approval successfully.',
                'request' => $approvalRequest->load(['currentStep.role', 'workflow', 'submitter']),
                'publication' => $publication->fresh(),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse('Validation failed', 422, $e->errors());
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->errorResponse('You do not have permission to submit this publication for approval.', 403);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to submit for approval: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Approve at current step
     * 
     * POST /api/v1/approvals/{request}/approve
     * 
     * @param ApprovalRequest $request
     * @param Request $httpRequest
     * @return JsonResponse
     */
    public function approve(ApprovalRequest $request, Request $httpRequest): JsonResponse
    {
        try {
            $validated = $httpRequest->validate([
                'comment' => 'nullable|string|max:1000',
            ]);

            $user = Auth::user();
            
            // Check if user can approve
            if (!$this->engine->canApprove($user, $request)) {
                return $this->errorResponse('You do not have permission to approve at this step.', 403);
            }

            $approvalRequest = $this->engine->approve($request, $user, $validated['comment'] ?? null);

            return $this->successResponse([
                'message' => 'Approval recorded successfully.',
                'request' => $approvalRequest,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse('Validation failed', 422, $e->errors());
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to approve: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reject at current step
     * 
     * POST /api/v1/approvals/{request}/reject
     * 
     * @param ApprovalRequest $request
     * @param Request $httpRequest
     * @return JsonResponse
     */
    public function reject(ApprovalRequest $request, Request $httpRequest): JsonResponse
    {
        try {
            $validated = $httpRequest->validate([
                'reason' => 'required|string|max:1000',
            ]);

            $user = Auth::user();
            
            // Check if user can reject
            if (!$this->engine->canApprove($user, $request)) {
                return $this->errorResponse('You do not have permission to reject at this step.', 403);
            }

            $approvalRequest = $this->engine->reject($request, $user, $validated['reason']);

            return $this->successResponse([
                'message' => 'Rejection recorded successfully.',
                'request' => $approvalRequest,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse('Validation failed', 422, $e->errors());
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to reject: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get pending approvals for current user
     * 
     * GET /api/v1/approvals/pending
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function pending(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $workspaceId = $user->current_workspace_id ?? $user->workspaces()->first()?->id;

            if (!$workspaceId) {
                return $this->errorResponse('No active workspace found.', 404);
            }

            // Get type parameter: 'to_approve' (default) or 'my_requests'
            $type = $request->query('type', 'to_approve');

            $pendingRequests = $this->engine->getPendingRequestsForUser($user, $workspaceId, $type);

            return $this->successResponse([
                'requests' => $pendingRequests,
                'count' => $pendingRequests->count(),
                'type' => $type,
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to fetch pending approvals: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get detailed approval status
     * 
     * GET /api/v1/approvals/{request}/status
     * 
     * @param ApprovalRequest $request
     * @return JsonResponse
     */
    public function status(ApprovalRequest $request): JsonResponse
    {
        try {
            $request->load([
                'workflow.levels',
                'currentStep.role',
                'submitter',
                'completedBy',
                'logs.user',
                'logs.approvalStep',
                'publication',
            ]);

            $data = [
                'request' => $request,
                'is_pending' => $request->isPending(),
                'is_approved' => $request->isApproved(),
                'is_rejected' => $request->isRejected(),
                'is_cancelled' => $request->isCancelled(),
            ];

            // Add rejection details if rejected
            if ($request->isRejected()) {
                $data['rejection_details'] = $request->getRejectionDetails();
            }

            return $this->successResponse($data);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to fetch approval status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Check if current user can approve
     * 
     * GET /api/v1/approvals/{request}/can-approve
     * 
     * @param ApprovalRequest $request
     * @return JsonResponse
     */
    public function canApprove(ApprovalRequest $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $canApprove = $this->engine->canApprove($user, $request);

            return $this->successResponse([
                'can_approve' => $canApprove,
                'current_step' => $request->currentStep?->load('role'),
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to check approval permission: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get approval history for publication
     * 
     * GET /api/v1/approvals/publication/{publication}/history
     * 
     * @param Publication $publication
     * @return JsonResponse
     */
    public function history(Publication $publication): JsonResponse
    {
        try {
            $history = $this->engine->getApprovalHistory($publication);

            return $this->successResponse([
                'history' => $history,
                'count' => $history->count(),
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to fetch approval history: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Clear publication cache for a workspace
     * 
     * This method invalidates all cached publication queries for a workspace
     * by incrementing the cache version number. This ensures that any subsequent
     * API calls will fetch fresh data from the database.
     * 
     * @param int $workspaceId
     * @return void
     */
    private function clearPublicationCache($workspaceId)
    {
        if (!$workspaceId) {
            return;
        }

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
                $keys = cache()->getRedis()->keys($pattern);
                if (!empty($keys)) {
                    cache()->getRedis()->del($keys);
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to clear Redis cache pattern', [
                    'pattern' => $pattern ?? 'unknown',
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
}
