<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PlatformConfigurationMonitor;
use App\Models\PlatformConfiguration;
use App\Models\PlatformConfigurationAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * FASE 10: Admin API - Endpoints para monitoreo y administración
 * 
 * Rutas:
 * GET    /api/admin/platform-config/statistics
 * GET    /api/admin/platform-config/health
 * GET    /api/admin/platform-config/usage-metrics
 * GET    /api/admin/platform-config/anomalies
 * GET    /api/admin/platform-config/audit-log
 * POST   /api/admin/platform-config/{platform}/enable
 * POST   /api/admin/platform-config/{platform}/disable
 */
class AdminPlatformConfigurationController extends Controller
{
    private PlatformConfigurationMonitor $monitor;

    public function __construct(PlatformConfigurationMonitor $monitor)
    {
        $this->middleware('auth');
        $this->middleware('admin');
        $this->monitor = $monitor;
    }

    /**
     * GET /api/admin/platform-config/statistics
     */
    public function statistics(): JsonResponse
    {
        return response()->json(
            $this->monitor->getStatistics()
        );
    }

    /**
     * GET /api/admin/platform-config/health
     */
    public function health(): JsonResponse
    {
        return response()->json(
            $this->monitor->getHealthStatus()
        );
    }

    /**
     * GET /api/admin/platform-config/usage-metrics
     */
    public function usageMetrics(Request $request): JsonResponse
    {
        $days = $request->query('days', 7);
        return response()->json(
            $this->monitor->getUsageMetrics($days)
        );
    }

    /**
     * GET /api/admin/platform-config/anomalies
     */
    public function anomalies(): JsonResponse
    {
        return response()->json([
            'anomalies' => $this->monitor->detectAnomalies(),
        ]);
    }

    /**
     * GET /api/admin/platform-config/audit-log
     */
    public function auditLog(Request $request): JsonResponse
    {
        $query = PlatformConfigurationAudit::query();

        if ($request->has('platform')) {
            $query->where('platform_key', $request->query('platform'));
        }

        if ($request->has('action')) {
            $query->where('action', $request->query('action'));
        }

        if ($request->has('since')) {
            $query->where('created_at', '>=', $request->query('since'));
        }

        return response()->json(
            $query->latest()->paginate(50)
        );
    }

    /**
     * POST /api/admin/platform-config/{platform}/enable
     */
    public function enablePlatform(string $platform): JsonResponse
    {
        PlatformConfiguration::where('platform_key', $platform)
            ->update(['is_active' => true]);

        return response()->json([
            'message' => "Platform {$platform} enabled",
            'platform' => $platform,
        ]);
    }

    /**
     * POST /api/admin/platform-config/{platform}/disable
     */
    public function disablePlatform(string $platform): JsonResponse
    {
        PlatformConfiguration::where('platform_key', $platform)
            ->update(['is_active' => false]);

        return response()->json([
            'message' => "Platform {$platform} disabled",
            'platform' => $platform,
        ]);
    }
}
