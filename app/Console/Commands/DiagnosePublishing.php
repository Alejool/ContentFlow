<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\PublishToSocialMedia;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;

class DiagnosePublishing extends Command
{
    protected $signature = 'diagnose:publishing';
    protected $description = 'Diagnose publishing system and queue issues';

    public function handle()
    {
        $this->info('=== DIAGNÓSTICO DEL SISTEMA DE PUBLICACIÓN ===');

        // 1. Verificar estado de Horizon
        $this->info('1. Verificando estado de Horizon...');
        try {
            $this->call('horizon:status');
        } catch (\Exception $e) {
            $this->error('Error al verificar Horizon: ' . $e->getMessage());
        }

        // 2. Verificar colas en Redis
        $this->info('2. Verificando colas en Redis...');
        try {
            $redis = Redis::connection();
            
            $publishingQueue = $redis->llen('contentflow_horizon:queue:publishing');
            $defaultQueue = $redis->llen('contentflow_horizon:queue:default');
            
            $this->line("Jobs en cola 'publishing': {$publishingQueue}");
            $this->line("Jobs en cola 'default': {$defaultQueue}");
            
            // Listar todas las colas
            $allQueues = $redis->keys('*queue*');
            $this->line('Colas disponibles: ' . implode(', ', $allQueues));
            
        } catch (\Exception $e) {
            $this->error('Error al conectar con Redis: ' . $e->getMessage());
        }

        // 3. Probar despacho de job simple
        $this->info('3. Probando despacho de job de prueba...');
        try {
            // Crear un job de prueba que no haga nada
            $testJob = new class {
                public function handle() {
                    \Log::info('Test job executed successfully');
                }
            };
            
            Queue::push($testJob, [], 'publishing');
            $this->info('Job de prueba despachado a cola "publishing"');
            
        } catch (\Exception $e) {
            $this->error('Error al despachar job de prueba: ' . $e->getMessage());
        }

        // 4. Verificar configuración de colas
        $this->info('4. Verificando configuración de colas...');
        $queueConfig = config('queue.connections.redis');
        $this->line('Conexión Redis configurada: ' . json_encode($queueConfig, JSON_PRETTY_PRINT));

        // 5. Verificar workers activos
        $this->info('5. Verificando workers activos...');
        try {
            $this->call('queue:monitor');
        } catch (\Exception $e) {
            $this->error('Error al verificar workers: ' . $e->getMessage());
        }

        $this->info('=== DIAGNÓSTICO COMPLETADO ===');
    }
}