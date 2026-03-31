<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use App\Services\Subscription\GranularLimitValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para consultar límites granulares del workspace.
 */
class GranularLimitsController extends Controller
{
    public function __construct(
        private GranularLimitValidator $validator
    ) {}

    /**
     * Get all granular limits and current usage for the workspace.
     */
    public function index(Request $request): JsonResponse
    {
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 403);
        }

        $limits = $this->validator->getGranularLimits($workspace);

        return response()->json([
            'workspace_id' => $workspace->id,
            'workspace_name' => $workspace->name,
            'plan' => $workspace->subscription?->plan ?? 'demo',
            'limits' => $limits,
            'usage' => [
                'publications' => [
                    'today' => $this->validator->getTodayPublicationsCount($workspace),
                    'daily_limit' => $limits['publications_per_day'] ?? 0,
                    'remaining_today' => $this->validator->getRemainingCount($workspace, 'publications_per_day'),
                    'currently_publishing' => $this->validator->getCurrentPublishingCount($workspace),
                    'simultaneous_limit' => $limits['publications_simultaneous'] ?? 1,
                ],
                'campaigns' => [
                    'active' => $this->validator->getActiveCampaignsCount($workspace),
                    'limit' => $limits['active_campaigns'] ?? 1,
                    'remaining' => $this->validator->getRemainingCount($workspace, 'active_campaigns'),
                ],
                'workflows' => [
                    'active' => $this->validator->getApprovalWorkflowsCount($workspace),
                    'limit' => $limits['approval_workflows'] ?? 0,
                    'remaining' => $this->validator->getRemainingCount($workspace, 'approval_workflows'),
                ],
                'exports' => [
                    'this_month' => $this->validator->getMonthlyExportsCount($workspace),
                    'limit' => $limits['exports_per_month'] ?? 5,
                    'remaining' => $this->validator->getRemainingCount($workspace, 'exports_per_month'),
                    'max_rows' => $limits['export_max_rows'] ?? 1000,
                ],
                'integrations' => [
                    'discord' => [
                        'active' => $this->validator->getExternalIntegrationsCount($workspace, 'discord'),
                        'limit' => $limits['external_integrations']['discord_webhooks'] ?? 0,
                    ],
                    'slack' => [
                        'active' => $this->validator->getExternalIntegrationsCount($workspace, 'slack'),
                        'limit' => $limits['external_integrations']['slack_webhooks'] ?? 0,
                    ],
                    'webhooks' => [
                        'active' => $this->validator->getExternalIntegrationsCount($workspace, 'webhook'),
                        'limit' => $limits['external_integrations']['custom_webhooks'] ?? 0,
                    ],
                ],
                'media' => [
                    'max_file_size_mb' => $limits['max_file_size_mb'] ?? 50,
                    'max_video_duration_minutes' => $limits['max_video_duration_minutes'] ?? 5,
                ],
                'api' => [
                    'requests_per_minute' => $limits['api_requests_per_minute'] ?? 10,
                    'requests_per_hour' => $limits['api_requests_per_hour'] ?? 100,
                ],
            ],
        ]);
    }

    /**
     * Check if a specific action can be performed.
     */
    public function checkLimit(Request $request, string $limitType): JsonResponse
    {
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 403);
        }

        $canPerform = match($limitType) {
            'daily_publications' => $this->validator->canPublishToday($workspace),
            'simultaneous_publications' => $this->validator->canPublishSimultaneously($workspace),
            'campaigns' => $this->validator->canCreateCampaign($workspace),
            'approval_workflows' => $this->validator->canCreateApprovalWorkflow($workspace),
            'exports' => $this->validator->canExport($workspace),
            'discord_integration' => $this->validator->canAddExternalIntegration($workspace, 'discord'),
            'slack_integration' => $this->validator->canAddExternalIntegration($workspace, 'slack'),
            'webhook_integration' => $this->validator->canAddExternalIntegration($workspace, 'webhook'),
            default => false,
        };

        $remaining = $this->validator->getRemainingCount($workspace, $limitType);

        return response()->json([
            'limit_type' => $limitType,
            'can_perform' => $canPerform,
            'remaining' => $remaining,
            'workspace_id' => $workspace->id,
            'plan' => $workspace->subscription?->plan ?? 'demo',
        ]);
    }

    /**
     * Check if user can create more workspaces.
     */
    public function checkWorkspaceLimit(Request $request): JsonResponse
    {
        $user = $request->user();
        $canCreate = $this->validator->canCreateWorkspace($user);
        
        $workspace = $user->workspaces()->first();
        $limits = $workspace ? $this->validator->getGranularLimits($workspace) : [];
        
        return response()->json([
            'can_create' => $canCreate,
            'current_count' => $user->workspaces()->count(),
            'limit' => $limits['workspaces_per_user'] ?? 1,
        ]);
    }

    /**
     * Check if a file can be uploaded.
     */
    public function checkFileUpload(Request $request): JsonResponse
    {
        $request->validate([
            'file_size' => 'required|integer|min:1',
            'duration_minutes' => 'nullable|integer|min:0',
        ]);

        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 403);
        }

        $fileSize = $request->input('file_size');
        $duration = $request->input('duration_minutes');

        $canUploadSize = $this->validator->canUploadFileSize($workspace, $fileSize);
        $canUploadDuration = $duration 
            ? $this->validator->canUploadVideoDuration($workspace, $duration)
            : true;

        return response()->json([
            'can_upload' => $canUploadSize && $canUploadDuration,
            'size_check' => [
                'allowed' => $canUploadSize,
                'file_size_bytes' => $fileSize,
                'max_size_bytes' => $this->validator->getMaxFileSize($workspace),
            ],
            'duration_check' => [
                'allowed' => $canUploadDuration,
                'duration_minutes' => $duration,
                'max_duration_minutes' => $this->validator->getMaxVideoDuration($workspace),
            ],
        ]);
    }

    /**
     * Clear all caches for the workspace.
     */
    public function clearCache(Request $request): JsonResponse
    {
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 403);
        }

        $this->validator->clearAllCaches($workspace);

        return response()->json([
            'message' => 'Cache cleared successfully',
            'workspace_id' => $workspace->id,
        ]);
    }
}
