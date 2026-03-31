<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Publications\Publication;
use App\Models\Social\SocialPostLog;
use App\Jobs\VerifyPlatformContentStatus;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ContentVerificationController extends Controller
{
    /**
     * Get verification status for a publication
     */
    public function getPublicationStatus(Publication $publication): JsonResponse
    {
        $this->authorize('view', $publication);

        $logs = $publication->socialPostLogs()
            ->with('socialAccount')
            ->whereIn('status', ['published', 'removed_on_platform'])
            ->get();

        $statusByPlatform = $logs->map(function ($log) {
            return [
                'id' => $log->id,
                'platform' => $log->platform,
                'status' => $log->status,
                'platform_post_id' => $log->platform_post_id,
                'post_url' => $log->post_url,
                'account_name' => $log->account_name,
                'published_at' => $log->published_at,
                'updated_at' => $log->updated_at,
                'error_message' => $log->error_message,
                'engagement_data' => $log->engagement_data,
            ];
        });

        return response()->json([
            'publication_id' => $publication->id,
            'status' => $publication->status,
            'platforms' => $statusByPlatform,
        ]);
    }

    /**
     * Manually trigger verification for a specific post log
     */
    public function verifyContent(Request $request, SocialPostLog $postLog): JsonResponse
    {
        $publication = $postLog->publication;
        
        if ($publication) {
            $this->authorize('view', $publication);
        }

        // Only verify published content
        if ($postLog->status !== 'published') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se puede verificar contenido publicado',
            ], 400);
        }

        try {
            // Dispatch verification job
            VerifyPlatformContentStatus::dispatch($postLog);

            Log::info('Manual content verification triggered', [
                'log_id' => $postLog->id,
                'platform' => $postLog->platform,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Verificación iniciada. Los resultados se actualizarán en unos momentos.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to trigger content verification', [
                'log_id' => $postLog->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al iniciar la verificación',
            ], 500);
        }
    }

    /**
     * Get verification statistics for workspace
     */
    public function getWorkspaceStats(Request $request): JsonResponse
    {
        $workspaceId = auth()->user()->current_workspace_id;

        $stats = [
            'total_published' => SocialPostLog::where('workspace_id', $workspaceId)
                ->where('status', 'published')
                ->count(),
            'removed_on_platform' => SocialPostLog::where('workspace_id', $workspaceId)
                ->where('status', 'removed_on_platform')
                ->count(),
            'last_verified' => SocialPostLog::where('workspace_id', $workspaceId)
                ->whereIn('status', ['published', 'removed_on_platform'])
                ->max('updated_at'),
            'by_platform' => SocialPostLog::where('workspace_id', $workspaceId)
                ->whereIn('status', ['published', 'removed_on_platform'])
                ->selectRaw('platform, status, COUNT(*) as count')
                ->groupBy('platform', 'status')
                ->get()
                ->groupBy('platform')
                ->map(function ($platformLogs) {
                    return [
                        'published' => $platformLogs->where('status', 'published')->sum('count'),
                        'removed' => $platformLogs->where('status', 'removed_on_platform')->sum('count'),
                    ];
                }),
        ];

        return response()->json($stats);
    }
}
