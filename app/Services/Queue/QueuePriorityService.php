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
    // Queue names with base priority levels
    private const QUEUES = [
        'publishing' => 100,    // Publishing operations (affected by plan priority)
        'publishing:notify' => 95, // Publishing notifications
        'notifications' => 90,  // User notifications
        'emails' => 85,         // Email delivery
        'high' => 75,           // Time-sensitive (scheduled posts, webhooks)
        'media-processing' => 50, // Image/video optimization
        'default' => 25,        // Standard operations
        'low' => 10,            // Background cleanup, analytics
        'bulk' => 5,            // Bulk operations, exports
    ];

    // Plan-based priority multipliers
    private const PLAN_PRIORITIES = [
        'enterprise' => 2.0,    // 100% MÁS de prioridad (el doble)
        'professional' => 0.85, // 15% menos prioridad
        'growth' => 0.70,       // 30% menos prioridad
        'starter' => 0.50,      // 50% menos prioridad
        'free' => 0.30,         // 70% menos prioridad
        'demo' => 0.30,         // 70% menos prioridad
    ];

    // Job type to queue mapping
    private const JOB_QUEUE_MAP = [
        'PublishToSocialMedia' => 'publishing',
        'BulkPublishPublications' => 'bulk',
        'SendNotificationJob' => 'notifications',
        'SendSystemNotificationJob' => 'notifications',
        'BulkPublishStartedNotification' => 'notifications',
        'BulkPublishCompletedNotification' => 'notifications',
        'ProcessScheduledPostJob' => 'high',
        'WebhookDeliveryJob' => 'high',
        'OptimizeImageJob' => 'media-processing',
        'ProcessVideoJob' => 'media-processing',
        'ProcessBackgroundUpload' => 'media-processing',
        'GenerateReelsFromVideo' => 'media-processing',
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
     * Calculate effective priority based on queue and plan
     * 
     * @param string $queue Queue name
     * @param string|null $planSlug Plan slug (enterprise, professional, etc.)
     * @return int Effective priority score
     */
    public function getEffectivePriority(string $queue, ?string $planSlug = null): int
    {
        $basePriority = $this->getPriority($queue);
        
        // Si no hay plan, usar prioridad base
        if (!$planSlug) {
            return $basePriority;
        }
        
        // Aplicar multiplicador de plan solo a colas específicas
        $affectedQueues = ['publishing', 'bulk'];
        
        if (!in_array($queue, $affectedQueues)) {
            return $basePriority;
        }
        
        $planMultiplier = self::PLAN_PRIORITIES[$planSlug] ?? self::PLAN_PRIORITIES['free'];
        
        // Calcular prioridad efectiva
        $effectivePriority = (int) round($basePriority * $planMultiplier);
        
        Log::debug('Calculated effective priority', [
            'queue' => $queue,
            'plan' => $planSlug,
            'base_priority' => $basePriority,
            'multiplier' => $planMultiplier,
            'effective_priority' => $effectivePriority
        ]);
        
        return $effectivePriority;
    }

    /**
     * Get plan priority multiplier
     */
    public function getPlanMultiplier(string $planSlug): float
    {
        return self::PLAN_PRIORITIES[$planSlug] ?? self::PLAN_PRIORITIES['free'];
    }

    /**
     * Get queue position estimate for a plan
     * 
     * @param string $queue Queue name
     * @param string $planSlug Plan slug
     * @return array Queue statistics with position estimate
     */
    public function getQueuePositionForPlan(string $queue, string $planSlug): array
    {
        $pendingJobs = $this->getPendingJobsCount($queue);
        $effectivePriority = $this->getEffectivePriority($queue, $planSlug);
        
        // Estimar posición en cola basada en prioridad
        // Jobs con mayor prioridad se procesan primero
        $estimatedPosition = $this->estimateQueuePosition($queue, $effectivePriority);
        
        return [
            'queue' => $queue,
            'plan' => $planSlug,
            'pending_jobs' => $pendingJobs,
            'effective_priority' => $effectivePriority,
            'estimated_position' => $estimatedPosition,
            'estimated_wait_minutes' => $this->estimateWaitTime($estimatedPosition),
        ];
    }

    /**
     * Estimate queue position based on priority
     */
    private function estimateQueuePosition(string $queue, int $priority): int
    {
        try {
            // Obtener todos los jobs en la cola con sus prioridades
            $key = "queues:{$queue}";
            $jobCount = Redis::llen($key);
            
            if ($jobCount === 0) {
                return 1;
            }
            
            // Estimar que jobs con mayor prioridad están adelante
            // Asumiendo distribución uniforme de planes
            $avgPriority = 50; // Prioridad promedio estimada
            
            if ($priority >= $avgPriority) {
                // Alta prioridad: posición en el primer tercio
                return max(1, (int) round($jobCount * 0.33));
            } elseif ($priority >= 40) {
                // Media prioridad: posición en el segundo tercio
                return max(1, (int) round($jobCount * 0.66));
            } else {
                // Baja prioridad: posición al final
                return max(1, $jobCount);
            }
            
        } catch (\Exception $e) {
            Log::warning('Failed to estimate queue position', [
                'queue' => $queue,
                'error' => $e->getMessage()
            ]);
            return 1;
        }
    }

    /**
     * Estimate wait time based on position
     */
    private function estimateWaitTime(int $position): int
    {
        if ($position <= 1) {
            return 0;
        }
        
        // Estimación: cada job toma aproximadamente 5 minutos en promedio
        // Con workers concurrentes, dividimos el tiempo
        $avgJobTimeMinutes = 5;
        $concurrentWorkers = config('queue.workers.publishing', 3);
        
        $estimatedMinutes = ceil(($position * $avgJobTimeMinutes) / $concurrentWorkers);
        
        return (int) $estimatedMinutes;
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
