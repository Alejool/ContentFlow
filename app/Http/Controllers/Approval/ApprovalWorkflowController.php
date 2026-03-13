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
            
            $approvalRequest = $this->engine->submitForApproval($publication, $user);

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

            $action = $this->engine->approve($request, $user, $validated['comment'] ?? null);

            return $this->successResponse([
                'message' => 'Approval recorded successfully.',
                'action' => $action,
                'request' => $request->fresh(['currentStep.role', 'workflow', 'publication']),
            ], 200);
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

            $action = $this->engine->reject($request, $user, $validated['reason']);

            return $this->successResponse([
                'message' => 'Publication rejected successfully.',
                'action' => $action,
                'request' => $request->fresh(['workflow', 'publication']),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse('Validation failed', 422, $e->errors());
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to reject: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get approval status with detailed flow
     * 
     * GET /api/v1/approvals/{request}/status
     * 
     * @param ApprovalRequest $request
     * @return JsonResponse
     */
    public function status(ApprovalRequest $request): JsonResponse
    {
        try {
            $status = $this->engine->getApprovalStatus($request);

            return $this->successResponse([
                'status' => $status,
            ], 200);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to retrieve status: ' . $e->getMessage(), 500);
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
            
            $pendingRequests = ApprovalRequest::pendingForUser($user)
                ->with([
                    'publication',
                    'currentStep.role',
                    'workflow',
                    'submitter',
                ])
                ->orderBy('submitted_at', 'desc')
                ->paginate($request->input('per_page', 15));

            return $this->successResponse([
                'requests' => $pendingRequests,
            ], 200);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to retrieve pending approvals: ' . $e->getMessage(), 500);
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
            $approvalRequest = ApprovalRequest::where('publication_id', $publication->id)
                ->with([
                    'actions.user',
                    'actions.step',
                    'stepApprovals.user',
                    'stepApprovals.step',
                ])
                ->first();

            if (!$approvalRequest) {
                return $this->successResponse([
                    'message' => 'No approval history found for this publication.',
                    'history' => [],
                ], 200);
            }

            return $this->successResponse([
                'request' => $approvalRequest,
                'actions' => $approvalRequest->actions()->orderBy('created_at', 'asc')->get(),
                'step_approvals' => $approvalRequest->stepApprovals()->orderBy('created_at', 'asc')->get(),
            ], 200);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to retrieve history: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Check if user can approve a specific request
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
                'current_step' => $request->currentStep ? [
                    'id' => $request->currentStep->id,
                    'name' => $request->currentStep->level_name,
                    'order' => $request->currentStep->level_number,
                ] : null,
            ], 200);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to check permissions: ' . $e->getMessage(), 500);
        }
    }
}
