<?php

namespace App\Console\Commands;

use App\Services\Queue\QueuePriorityService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class MonitorQueuePriorities extends Command
{
    protected $signature = 'queue:monitor-priorities 
                            {--queue=publishing : Queue to monitor (publishing, bulk, notifications)}
                            {--watch : Watch mode (refresh every 5 seconds)}';

    protected $description = 'Monitor queue priorities and plan-based distribution';

    public function handle(QueuePriorityService $queueService): int
    {
        $queue = $this->option('queue');
        $watch = $this->option('watch');

        if ($watch) {
            $this->info("Monitoring queue '{$queue}' (press Ctrl+C to stop)...\n");
            
            while (true) {
                $this->displayQueueStats($queueService, $queue);
                sleep(5);
                
                // Clear screen for watch mode
                if (PHP_OS_FAMILY === 'Windows') {
                    system('cls');
                } else {
                    system('clear');
                }
            }
        } else {
            $this->displayQueueStats($queueService, $queue);
        }

        return 0;
    }

    private function displayQueueStats(QueuePriorityService $queueService, string $queue): void
    {
        $this->info("=== Queue Priority Monitor ===");
        $this->info("Queue: {$queue}");
        $this->info("Time: " . now()->format('Y-m-d H:i:s'));
        $this->newLine();

        // Estadísticas generales de la cola
        $stats = $queueService->getQueueStats();
        
        if (isset($stats[$queue])) {
            $queueStats = $stats[$queue];
            
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Base Priority', $queueStats['priority']],
                    ['Pending Jobs', $queueStats['pending_jobs']],
                    ['Current Load', $queueStats['current_load']],
                    ['Throttled', $queueStats['is_throttled'] ? 'Yes' : 'No'],
                ]
            );
        }

        $this->newLine();

        // Prioridades por plan
        $this->info("=== Plan-Based Priorities ===");
        
        $plans = ['enterprise', 'professional', 'growth', 'starter', 'free'];
        $planData = [];

        foreach ($plans as $plan) {
            $queueInfo = $queueService->getQueuePositionForPlan($queue, $plan);
            
            $planData[] = [
                ucfirst($plan),
                $queueInfo['effective_priority'],
                $queueInfo['estimated_position'],
                $queueInfo['estimated_wait_minutes'] . ' min',
            ];
        }

        $this->table(
            ['Plan', 'Effective Priority', 'Est. Position', 'Est. Wait Time'],
            $planData
        );

        $this->newLine();

        // Distribución de jobs por prioridad (últimas 24h)
        $this->info("=== Job Distribution (Last 24h) ===");
        $this->displayPriorityDistribution($queue);
    }

    private function displayPriorityDistribution(string $queue): void
    {
        $date = now()->format('Y-m-d');
        $priorities = [100, 85, 70, 50, 30];
        $distribution = [];

        foreach ($priorities as $priority) {
            $key = "metrics:queue:{$queue}:priority:{$priority}:{$date}";
            $count = Redis::get($key) ?? 0;
            
            if ($count > 0) {
                $distribution[] = [
                    "Priority {$priority}",
                    $count,
                    $this->getPriorityLabel($priority),
                ];
            }
        }

        if (empty($distribution)) {
            $this->warn('No job distribution data available for today.');
            return;
        }

        $this->table(
            ['Priority Level', 'Jobs Processed', 'Plan'],
            $distribution
        );
    }

    private function getPriorityLabel(int $priority): string
    {
        return match(true) {
            $priority >= 100 => 'Enterprise',
            $priority >= 85 => 'Professional',
            $priority >= 70 => 'Growth',
            $priority >= 50 => 'Starter',
            default => 'Free/Demo',
        };
    }
}
