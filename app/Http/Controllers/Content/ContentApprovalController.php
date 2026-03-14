<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Models\Publications\Publication;
use App\Models\Approval\ApprovalRequest;
use App\Services\Approval\ApprovalWorkflowEngine;
use App\Http\Requests\ContentApproval\ApproveContentRequest;
use App\Http\Requests\ContentApproval\RejectContentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

/**
 * ContentApprovalController
 * 
 * Controlador legacy que redirige al nuevo sistema de aprobaciones.
 * Mantiene compatibilidad con rutas antiguas (/api/v1/content/{id}/submit-for-approval, etc.)
 */
class ContentApprovalController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ApprovalWorkflowEngine $engine
    ) {}

    /**
     * Submit content for approval
     * POST /api/v1/content/{content}/submit-for-approval
     */
    public function submitForApproval(Publication $content): JsonResponse
    {
        Log::info('Submit for approval attempt (legacy route)', [
            'user_id' => Auth::id(),
            'content_id' => $content->id,
        ]);

        try {
            Gate::authorize('submitForApproval', $content);

            $user = Auth::user();
            
            // Check if there's an enabled workflow
            $workflow = $content->workspace->approvalWorkflow;
            $hasWorkflow = $workflow && $workflow->is_enabled && $workflow->levels && $workflow->levels->isNotEmpty();
            
            if ($hasWorkflow) {

              Log::info('esta entrando a tine workflow');
                // Use ApprovalWorkflowEngine for multi-level workflow
                $approvalRequest = $this->engine->submitForApproval($content, $user);
            } else {
                // Create simple approval request (no workflow)
                Log::info('Creating simple approval request (no workflow) - legacy route', [
                    'content_id' => $content->id,
                    'user_id' => $user->id,
                ]);
                
                // Update publication status
                $content->update([
                    'status' => 'pending_review',
                    'rejected_by' => null,
                    'rejected_at' => null,
                    'rejection_reason' => null,
                    'current_approval_step_id' => null,
                ]);
                
                // Create simple approval request
                $approvalRequest = \App\Models\Approval\ApprovalRequest::create([
                    'publication_id' => $content->id,
                    'workflow_id' => null,
                    'current_step_id' => null,
                    'status' => \App\Models\Approval\ApprovalRequest::STATUS_PENDING,
                    'submitted_by' => $user->id,
                    'submitted_at' => now(),
                    'metadata' => [
                        'ip' => request()->ip(),
                        'user_agent' => request()->userAgent(),
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
                        'ip' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                        'simple_approval' => true,
                    ],
                ]);
                
                Log::info('Simple ApprovalRequest created successfully (no workflow) - legacy route', [
                    'content_id' => $content->id,
                    'request_id' => $approvalRequest->id,
                ]);
            }

            $content->refresh();

            return $this->successResponse([
                'message' => 'Content submitted for approval successfully.',
                'content' => $content,
                'publication' => $content,
                'request' => $approvalRequest,
                'approval_info' => [
                    'current_level' => $approvalRequest->currentStep?->level_number,
                    'level_name' => $approvalRequest->currentStep?->level_name,
                    'approvers' => [],
                    'approver_count' => 0,
                ],
            ], 200);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->errorResponse('You do not have permission to submit this content for approval.', 403);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to submit content for approval: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Approve content at current step
     * POST /api/v1/content/{content}/approve
     */
    public function approve(Publication $content, ApproveContentRequest $request): JsonResponse
    {
        try {
            Gate::authorize('approve', $content);

            $user = Auth::user();

            // Obtener la solicitud activa
            $approvalRequest = ApprovalRequest::where('publication_id', $content->id)
                ->where('status', ApprovalRequest::STATUS_PENDING)
                ->latest('submitted_at')
                ->first();

            if (!$approvalRequest) {
                return $this->errorResponse('No active approval request found.', 404);
            }

            $updated = $this->engine->approve($approvalRequest, $user, $request->input('comment'));

            return $this->successResponse([
                'message' => 'Content approved successfully.',
                'content' => $content->fresh(),
                'request' => $updated,
            ], 200);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->errorResponse('You do not have permission to approve this content.', 403);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to approve content: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reject content
     * POST /api/v1/content/{content}/reject
     */
    public function reject(Publication $content, RejectContentRequest $request): JsonResponse
    {
        try {
            Gate::authorize('reject', $content);

            $user = Auth::user();

            // Obtener la solicitud activa
            $approvalRequest = ApprovalRequest::where('publication_id', $content->id)
                ->where('status', ApprovalRequest::STATUS_PENDING)
                ->latest('submitted_at')
                ->first();

            if (!$approvalRequest) {
                return $this->errorResponse('No active approval request found.', 404);
            }

            $updated = $this->engine->reject($approvalRequest, $user, $request->input('reason'));

            return $this->successResponse([
                'message' => 'Content rejected successfully.',
                'content' => $content->fresh(),
                'request' => $updated,
            ], 200);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->errorResponse('You do not have permission to reject this content.', 403);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to reject content: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get approval flow visualization
     * GET /api/v1/content/{content}/approval-flow
     */
    public function getApprovalFlow(Publication $content): JsonResponse
    {
        try {
            $history = $this->engine->getApprovalHistory($content);
            $activeRequest = $history->firstWhere('status', ApprovalRequest::STATUS_PENDING) ?? $history->first();

            return $this->successResponse([
                'success' => true,
                'history' => $history,
                'active_request' => $activeRequest,
                'publication_status' => $content->status,
            ], 200);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to retrieve approval flow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get approval status
     * GET /api/v1/content/{content}/approval-status
     */
    public function approvalStatus(Publication $content): JsonResponse
    {
        try {
            $activeRequest = ApprovalRequest::with(['currentStep.role', 'workflow', 'submitter'])
                ->where('publication_id', $content->id)
                ->where('status', ApprovalRequest::STATUS_PENDING)
                ->latest('submitted_at')
                ->first();

            return $this->successResponse([
                'request' => $activeRequest,
                'publication_status' => $content->status,
            ], 200);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to retrieve approval status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get approval history
     * GET /api/v1/content/{content}/approval-history
     */
    public function approvalHistory(Publication $content): JsonResponse
    {
        try {
            $history = $this->engine->getApprovalHistory($content);

            return $this->successResponse([
                'history' => $history,
                'count' => $history->count(),
            ], 200);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to retrieve approval history: ' . $e->getMessage(), 500);
        }
    }
}
