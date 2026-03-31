<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseCacheStats extends Command
{
    protected $signature = 'cache:stats';
    protected $description = 'Muestra estadísticas de caché y colas en database';

    public function handle(): int
    {
        $this->info('📊 Estadísticas de Database Cache/Queue');
        $this->newLine();
        
        // Stats de caché
        $cacheTotal = DB::table('cache')->count();
        $cacheExpired = DB::table('cache')->where('expiration', '<', time())->count();
        $cacheActive = $cacheTotal - $cacheExpired;
        
        $this->line("🗄️  CACHE:");
        $this->line("   Total: {$cacheTotal}");
        $this->line("   Activas: {$cacheActive}");
        $this->line("   Expiradas: {$cacheExpired}");
        
        // Stats de locks
        $locksTotal = DB::table('cache_locks')->count();
        $locksExpired = DB::table('cache_locks')->where('expiration', '<', time())->count();
        
        $this->newLine();
        $this->line("🔒 LOCKS:");
        $this->line("   Total: {$locksTotal}");
        $this->line("   Expirados: {$locksExpired}");
        
        // Stats de jobs
        $jobsPending = DB::table('jobs')->whereNull('reserved_at')->count();
        $jobsProcessing = DB::table('jobs')->whereNotNull('reserved_at')->count();
        $jobsFailed = DB::table('failed_jobs')->count();
        
        $this->newLine();
        $this->line("⚙️  JOBS:");
        $this->line("   Pendientes: {$jobsPending}");
        $this->line("   Procesando: {$jobsProcessing}");
        $this->line("   Fallidos: {$jobsFailed}");
        
        // Stats de sesiones
        if (Schema::hasTable('sessions')) {
            $sessionsTotal = DB::table('sessions')->count();
            $sessionsActive = DB::table('sessions')
                ->where('last_activity', '>', time() - 3600)
                ->count();
            
            $this->newLine();
            $this->line("👥 SESSIONS:");
            $this->line("   Total: {$sessionsTotal}");
            $this->line("   Activas (1h): {$sessionsActive}");
        }
        
        // Tamaño de tablas
        $this->newLine();
        $this->line("💾 TAMAÑO DE TABLAS:");
        
        $tables = ['cache', 'cache_locks', 'jobs', 'failed_jobs', 'sessions'];
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $size = DB::selectOne("
                    SELECT pg_size_pretty(pg_total_relation_size(?)) as size
                ", [$table]);
                $this->line("   {$table}: {$size->size}");
            }
        }
        
        // Recomendaciones
        $this->newLine();
        if ($cacheExpired > 100) {
            $this->warn("⚠️  Hay {$cacheExpired} entradas de caché expiradas. Ejecuta: php artisan cache:cleanup-database");
        }
        
        if ($jobsFailed > 10) {
            $this->warn("⚠️  Hay {$jobsFailed} jobs fallidos. Revisa: php artisan queue:failed");
        }
        
        return Command::SUCCESS;
    }
}
