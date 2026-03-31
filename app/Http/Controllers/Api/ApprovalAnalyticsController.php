<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace\Workspace;
use App\Services\ApprovalAnalyticsService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ApprovalAnalyticsController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ApprovalAnalyticsService $analyticsService
    ) {}

    /**
     * Get workspace by ID or slug
     */
    protected function getWorkspace($idOrSlug): Workspace
    {
        return Workspace::where(function ($q) use ($idOrSlug) {
            if (is_numeric($idOrSlug)) {
                $q->where('id', $idOrSlug);
            }
            $q->orWhere('slug', $idOrSlug);
        })->firstOrFail();
    }

    /**
     * Get all approval analytics for a workspace
     * 
     * GET /api/workspaces/{workspace}/approval-analytics
     * 
     * Query parameters:
     * - days_threshold: Number of days for stale content (default: 7)
     */
    public function index(Request $request, $idOrSlug): JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);

            // Get days threshold from query parameter
            $daysThreshold = $request->query('days_threshold', 7);

            // Gather all analytics
            $analytics = [
                'workspace_id' => $workspace->id,
                'workspace_name' => $workspace->name,
                'generated_at' => now()->toIso8601String(),
                'average_approval_time_by_level' => $this->analyticsService->getAverageApprovalTime($workspace),
                'approval_rates_by_role' => $this->analyticsService->getApprovalRatesByRole($workspace),
                'pending_content_by_level' => $this->analyticsService->getPendingContentByLevel($workspace),
                'stale_pending_content' => $this->analyticsService->getStalePendingContent($workspace, $daysThreshold),
                'approver_workload' => $this->analyticsService->getApproverWorkload($workspace),
                'average_publication_time_seconds' => $this->analyticsService->getAveragePublicationTime($workspace),
            ];

            return $this->successResponse($analytics);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve analytics: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Export approval analytics
     * 
     * GET /api/workspaces/{workspace}/approval-analytics/export
     * 
     * Query parameters:
     * - format: 'json' or 'csv' (default: 'json')
     * - days_threshold: Number of days for stale content (default: 7)
     */
    public function export(Request $request, $idOrSlug): Response|JsonResponse
    {
        try {
            $workspace = $this->getWorkspace($idOrSlug);

            // Validate format parameter
            $format = $request->query('format', 'json');
            if (!in_array($format, ['json', 'csv'])) {
                return $this->errorResponse('Invalid format. Supported formats: json, csv', 422);
            }

            // Export analytics
            $exportData = $this->analyticsService->exportAnalytics($workspace, $format);

            // Determine content type and filename
            $contentType = $format === 'csv' ? 'text/csv' : 'application/json';
            $filename = sprintf(
                'approval-analytics-%s-%s.%s',
                $workspace->slug ?? $workspace->id,
                now()->format('Y-m-d'),
                $format
            );

            // Return as downloadable file
            return response($exportData, 200)
                ->header('Content-Type', $contentType)
                ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to export analytics: ' . $e->getMessage(), 500);
        }
    }
}
