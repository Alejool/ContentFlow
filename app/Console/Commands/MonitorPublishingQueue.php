<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class MonitorPublishingQueue extends Command
{
    protected $signature = 'queue:monitor-publishing';
    protected $description = 'Monitor publishing queue and alert when it gets too long';

    public function handle()
    {
        $queueName = 'queues:publishing';
        $queueSize = Redis::llen($queueName);
        
        $this->info("Publishing queue size: {$queueSize}");
        
        // Alerta si hay más de 20 jobs en cola
        if ($queueSize > 20) {
            $this->warn("⚠️  Publishing queue is getting long: {$queueSize} jobs waiting");
            
            Log::warning('Publishing queue is getting long', [
                'queue_size' => $queueSize,
                'threshold' => 20
            ]);
            
            // Aquí podrías enviar una notificación a los admins
            // Notification::route('slack', config('services.slack.webhook'))
            //     ->notify(new \App\Notifications\QueueBacklogNotification($queueSize));
        }
        
        // Alerta crítica si hay más de 50 jobs
        if ($queueSize > 50) {
            $this->error("🚨 CRITICAL: Publishing queue is severely backed up: {$queueSize} jobs!");
            
            Log::error('Publishing queue severely backed up', [
                'queue_size' => $queueSize,
                'critical_threshold' => 50
            ]);
        }
        
        // Mostrar estadísticas de workers
        $this->showWorkerStats();
        
        return 0;
    }
    
    private function showWorkerStats()
    {
        $this->info("\n--- Worker Statistics ---");
        
        // Obtener información de Horizon
        $masters = Redis::smembers('masters');
        
        foreach ($masters as $master) {
            $supervisors = Redis::smembers("supervisors:{$master}");
            
            foreach ($supervisors as $supervisor) {
                $processes = Redis::scard("supervisor:{$supervisor}:processes");
                $this->info("Supervisor {$supervisor}: {$processes} active processes");
            }
        }
    }
}
