<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class ShowCacheDrivers extends Command
{
    protected $signature = 'cache:show-drivers';
    protected $description = 'Muestra qué drivers de cache/queue/session están activos';

    public function handle(): int
    {
        $this->info('🔍 Configuración de Drivers');
        $this->newLine();

        // Cache
        $cacheDriver = config('cache.default');
        $cacheIcon = $this->getIcon($cacheDriver);
        $this->line("  Cache:   {$cacheIcon} {$cacheDriver}");

        // Queue
        $queueDriver = config('queue.default');
        $queueIcon = $this->getIcon($queueDriver);
        $this->line("  Queue:   {$queueIcon} {$queueDriver}");

        // Session
        $sessionDriver = config('session.driver');
        $sessionIcon = $this->getIcon($sessionDriver);
        $this->line("  Session: {$sessionIcon} {$sessionDriver}");

        $this->newLine();

        // Redis status
        $redisAvailable = false;
        try {
            Redis::connection()->ping();
            $redisAvailable = true;
            $this->line("  Redis:   ✅ Disponible");
        } catch (\Exception $e) {
            $this->line("  Redis:   ❌ No disponible");
        }

        $this->newLine();

        // Warning si usa database
        $isUsingDatabase = in_array('database', [$cacheDriver, $queueDriver, $sessionDriver]);
        if ($isUsingDatabase) {
            $this->warn('⚠️  ADVERTENCIA: Usando database como driver');
            $this->line('   Performance reducida 5-10x comparado con Redis');
            $this->line('   Solo recomendado para desarrollo/demo');
            $this->newLine();
        }

        // Environment
        $env = config('app.env');
        $this->line("  Environment: {$env}");

        // Recommendations
        if ($isUsingDatabase && $env === 'production') {
            $this->newLine();
            $this->error('❌ NO usar database cache en producción!');
            $this->line('   Cambia a Redis en .env:');
            $this->line('   CACHE_STORE=redis');
            $this->line('   QUEUE_CONNECTION=redis');
            $this->line('   SESSION_DRIVER=redis');
        }

        return Command::SUCCESS;
    }

    private function getIcon(string $driver): string
    {
        return match ($driver) {
            'redis' => '⚡',
            'database' => '🗄️',
            'file' => '📁',
            'array' => '💾',
            default => '❓',
        };
    }
}
