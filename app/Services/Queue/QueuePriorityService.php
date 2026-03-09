<?php

namespace App\Services\Queue;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

/**
 * Intelligent queue priority management
 * Dynamically adjusts job priorities based on system load and business rules
 */
class QueuePriorityService
{
    // Queue names with priority levels
    private const QUEUES = [
        'critical' => 100,      // User-facing operations (publishing, notifications)
        'high' => 75,           // Time-sensitive (scheduled posts, webhooks)
        'media-processing' => 50, // Image/video optimization
        'default' => 25,        // Standard operations
        'low' => 10,            // Background cleanup, analytics
        'bulk' => 5,            // Bulk operations, exports
    ];

    // Job type to queue mapping
    private const JOB_QUEUE_MAP = [
        'PublishPublicationJob' => 'critical',
        'SendNotificationJob' => 'critical',
        'ProcessScheduledPostJob' => 'high',
        'WebhookDeliveryJob' => 'high',
        'OptimizeImageJob' => 'media-processing',
        'ProcessVideoJob' => 'media-processing',
        'GenerateAnalyticsJob' => 'low',
        'CleanupOldFilesJob' => 'low',
        'BulkExportJob' => 'bulk',
    ];

    /**
     * Get appropriate queue for job type
     */
    public function getQueueForJob(string $jobClass): string
    {
        $jobName = class_basename($jobClass);
        return self::JOB_QUEUE_MAP[$jobName] ?? 'default';
    }

    /**
     * Get queue priority score
     */
    public function getPriority(string $queue): int
    {
        return self::QUEUES[$queue] ?? 25;
    }

    /**
     * Get all queues ordered by priority
     */
    public function getOrderedQueues(): array
    {
        $queues = self::QUEUES;
        arsort($queues);
        return array_keys($queues);
    }

    /**
     * Check if queue should be throttled based on load
     */
    public function shouldThrottle(string $queue): bool
    {
        $key = "queue:throttle:{$queue}";
        $currentLoad = Redis::get($key) ?? 0;

        // Throttle thresholds per queue
        $thresholds = [
            'critical' => 1000,
            'high' => 500,
            'media-processing' => 200,
            'default' => 300,
            'low' => 100,
            'bulk' => 50,
        ];

        $threshold = $thresholds[$queue] ?? 300;

        return $currentLoad >= $threshold;
    }

    /**
     * Increment queue load counter
     */
    public function incrementLoad(string $queue): void
    {
        $key = "queue:throttle:{$queue}";
        Redis::incr($key);
        Redis::expire($key, 60); // Reset every minute
    }

    /**
     * Decrement queue load counter
     */
    public function decrementLoad(string $queue): void
    {
        $key = "queue:throttle:{$queue}";
        Redis::decr($key);
    }

    /**
     * Get queue statistics
     */
    public function getQueueStats(): array
    {
        $stats = [];

        foreach (array_keys(self::QUEUES) as $queue) {
            $stats[$queue] = [
                'priority' => $this->getPriority($queue),
                'current_load' => Redis::get("queue:throttle:{$queue}") ?? 0,
                'is_throttled' => $this->shouldThrottle($queue),
                'pending_jobs' => $this->getPendingJobsCount($queue),
            ];
        }

        return $stats;
    }

    /**
     * Get pending jobs count for queue
     */
    private function getPendingJobsCount(string $queue): int
    {
        try {
            $connection = config('queue.default');
            $key = "queues:{$queue}";
            return Redis::llen($key);
        } catch (\Exception $e) {
            Log::warning('Failed to get pending jobs count', [
                'queue' => $queue,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Rebalance queues based on current load
     */
    public function rebalanceQueues(): array
    {
        $stats = $this->getQueueStats();
        $actions = [];

        foreach ($stats as $queue => $data) {
            // If high-priority queue is overloaded, scale up workers
            if ($data['priority'] >= 75 && $data['is_throttled']) {
                $actions[] = [
                    'action' => 'scale_up',
                    'queue' => $queue,
                    'reason' => 'High priority queue overloaded',
                    'current_load' => $data['current_load'],
                ];
            }

            // If low-priority queue has too many pending jobs, consider pausing
            if ($data['priority'] <= 25 && $data['pending_jobs'] > 1000) {
                $actions[] = [
                    'action' => 'pause',
                    'queue' => $queue,
                    'reason' => 'Low priority queue backlog too large',
                    'pending_jobs' => $data['pending_jobs'],
                ];
            }
        }

        if (!empty($actions)) {
            Log::info('Queue rebalancing actions recommended', ['actions' => $actions]);
        }

        return $actions;
    }

    /**
     * Get recommended worker distribution
     */
    public function getRecommendedWorkerDistribution(int $totalWorkers = 10): array
    {
        $distribution = [];
        $totalPriority = array_sum(self::QUEUES);

        foreach (self::QUEUES as $queue => $priority) {
            $workers = max(1, round(($priority / $totalPriority) * $totalWorkers));
            $distribution[$queue] = $workers;
        }

        return $distribution;
    }

    /**
     * Log queue metrics for monitoring
     */
    public function logMetrics(): void
    {
        $stats = $this->getQueueStats();

        Log::info('Queue metrics', [
            'timestamp' => now()->toIso8601String(),
            'queues' => $stats,
            'total_pending' => array_sum(array_column($stats, 'pending_jobs')),
            'throttled_queues' => array_keys(array_filter($stats, fn($s) => $s['is_throttled'])),
        ]);
    }
}
