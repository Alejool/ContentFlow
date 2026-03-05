<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SubscriptionTrackingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SubscriptionHistoryController extends Controller
{
    public function __construct(
        protected SubscriptionTrackingService $trackingService
    ) {}

    /**
     * Get the authenticated user's subscription history.
     */
    public function index(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 10);
        $history = $this->trackingService->getUserSubscriptionHistory($request->user(), $limit);

        return response()->json([
            'success' => true,
            'data' => $history->map(function ($item) {
                return [
                    'id' => $item->id,
                    'plan_name' => $item->plan_name,
                    'price' => $item->price,
                    'billing_cycle' => $item->billing_cycle,
                    'change_type' => $item->change_type,
                    'previous_plan' => $item->previous_plan,
                    'reason' => $item->reason,
                    'started_at' => $item->started_at,
                    'ended_at' => $item->ended_at,
                    'is_active' => $item->is_active,
                    'duration_days' => $item->getDurationInDays(),
                    'usage_tracking' => $item->usageTracking->map(function ($usage) {
                        return [
                            'year' => $usage->year,
                            'month' => $usage->month,
                            'publications' => [
                                'used' => $usage->publications_used,
                                'limit' => $usage->publications_limit,
                                'percentage' => $usage->getPublicationsUsagePercentage(),
                            ],
                            'storage' => [
                                'used_bytes' => $usage->storage_used_bytes,
                                'limit_bytes' => $usage->storage_limit_bytes,
                                'percentage' => $usage->getStorageUsagePercentage(),
                            ],
                        ];
                    }),
                ];
            }),
        ]);
    }

    /**
     * Get current month usage for the authenticated user.
     */
    public function currentUsage(Request $request): JsonResponse
    {
        $usage = $this->trackingService->getCurrentMonthUsage($request->user());

        if (!$usage) {
            return response()->json([
                'success' => false,
                'message' => 'No active subscription found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'period' => [
                    'year' => $usage->year,
                    'month' => $usage->month,
                    'start' => $usage->period_start,
                    'end' => $usage->period_end,
                ],
                'plan' => $usage->subscriptionHistory->plan_name,
                'publications' => [
                    'used' => $usage->publications_used,
                    'limit' => $usage->publications_limit,
                    'remaining' => $usage->getRemainingPublications(),
                    'percentage' => $usage->getPublicationsUsagePercentage(),
                    'limit_reached' => $usage->hasReachedPublicationsLimit(),
                ],
                'storage' => [
                    'used_bytes' => $usage->storage_used_bytes,
                    'used_mb' => round($usage->storage_used_bytes / (1024 * 1024), 2),
                    'used_gb' => round($usage->storage_used_bytes / (1024 * 1024 * 1024), 2),
                    'limit_bytes' => $usage->storage_limit_bytes,
                    'limit_gb' => round($usage->storage_limit_bytes / (1024 * 1024 * 1024), 2),
                    'remaining_bytes' => $usage->getRemainingStorage(),
                    'percentage' => $usage->getStorageUsagePercentage(),
                    'limit_reached' => $usage->hasReachedStorageLimit(),
                ],
                'social_accounts' => [
                    'used' => $usage->social_accounts_used,
                    'limit' => $usage->social_accounts_limit,
                ],
                'ai_requests' => [
                    'used' => $usage->ai_requests_used,
                    'limit' => $usage->ai_requests_limit,
                ],
                'additional_metrics' => [
                    'reels_generated' => $usage->reels_generated,
                    'scheduled_posts' => $usage->scheduled_posts,
                    'analytics_views' => $usage->analytics_views,
                ],
                'limits_reached' => $usage->limit_reached,
                'limits_reached_at' => $usage->limit_reached_at,
            ],
        ]);
    }

    /**
     * Get usage summary for a specific period.
     */
    public function usageSummary(Request $request): JsonResponse
    {
        $request->validate([
            'year' => 'required|integer|min:2020|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $summary = $this->trackingService->getUsageSummary(
            $request->user(),
            $request->input('year'),
            $request->input('month')
        );

        if (!$summary) {
            return response()->json([
                'success' => false,
                'message' => 'No usage data found for the specified period',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get total usage statistics across all time.
     */
    public function totalStats(Request $request): JsonResponse
    {
        $stats = $this->trackingService->getTotalUsageStats($request->user());

        return response()->json([
            'success' => true,
            'data' => [
                'total_publications' => $stats['total_publications'],
                'total_storage_bytes' => $stats['total_storage_bytes'],
                'total_storage_gb' => round($stats['total_storage_bytes'] / (1024 * 1024 * 1024), 2),
                'total_ai_requests' => $stats['total_ai_requests'],
                'total_reels_generated' => $stats['total_reels_generated'],
                'total_scheduled_posts' => $stats['total_scheduled_posts'],
                'months_tracked' => $stats['months_tracked'],
            ],
        ]);
    }
}
