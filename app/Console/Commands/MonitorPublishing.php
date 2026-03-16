<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\DB;

class MonitorPublishing extends Command
{
    protected $signature = 'monitor:publishing';
    protected $description = 'Monitor publishing system in real-time';

    public function handle()
    {
        $this->info('🔍 MONITOREANDO SISTEMA DE PUBLICACIÓN EN TIEMPO REAL');
        $this->info('Presiona Ctrl+C para detener');
        $this->newLine();

        $lastPublicationCount = 0;
        $lastQueueSize = 0;

        while (true) {
            // Verificar nuevas publicaciones
            $currentPublications = DB::table('publications')
                ->where('status', 'publishing')
                ->count();

            // Verificar cola de Redis
            try {
                $redis = Redis::connection();
                $queueSize = $redis->llen('contentflow_horizon:queue:publishing');
                $allQueues = $redis->keys('*queue*');
                
                // Solo mostrar cambios
                if ($currentPublications !== $lastPublicationCount || $queueSize !== $lastQueueSize) {
                    $this->info('[' . now()->format('H:i:s') . '] Estado actual:');
                    $this->line("  📝 Publicaciones en 'publishing': {$currentPublications}");
                    $this->line("  📋 Jobs en cola 'publishing': {$queueSize}");
                    $this->line("  🔧 Colas disponibles: " . count($allQueues));
                    
                    if ($currentPublications > 0 && $queueSize === 0) {
                        $this->error("  ⚠️  PROBLEMA: Hay publicaciones 'publishing' pero NO hay jobs en cola!");
                    }
                    
                    if ($queueSize > 0) {
                        $this->info("  ✅ Jobs encontrados en cola, Horizon debería procesarlos");
                    }
                    
                    $this->newLine();
                }

                $lastPublicationCount = $currentPublications;
                $lastQueueSize = $queueSize;

            } catch (\Exception $e) {
                $this->error('Error conectando a Redis: ' . $e->getMessage());
            }

            sleep(2); // Verificar cada 2 segundos
        }
    }
}