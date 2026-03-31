<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupDatabaseCache extends Command
{
    protected $signature = 'cache:cleanup-database';
    protected $description = 'Limpia entradas expiradas de caché y jobs antiguos';

    public function handle(): int
    {
        $now = time();
        
        // Limpiar caché expirado
        $deletedCache = DB::table('cache')
            ->where('expiration', '<', $now)
            ->delete();
        
        // Limpiar cache_locks expirados
        $deletedLocks = DB::table('cache_locks')
            ->where('expiration', '<', $now)
            ->delete();
        
        // Limpiar jobs completados hace más de 1 hora
        $oneHourAgo = $now - 3600;
        $deletedJobs = DB::table('jobs')
            ->where('reserved_at', '<', $oneHourAgo)
            ->where('attempts', '>', 0)
            ->delete();
        
        // Limpiar sesiones expiradas (más de 24 horas)
        $oneDayAgo = $now - 86400;
        $deletedSessions = DB::table('sessions')
            ->where('last_activity', '<', $oneDayAgo)
            ->delete();
        
        // VACUUM para recuperar espacio
        DB::statement('VACUUM ANALYZE cache');
        DB::statement('VACUUM ANALYZE cache_locks');
        DB::statement('VACUUM ANALYZE jobs');
        DB::statement('VACUUM ANALYZE sessions');
        
        $this->info("✅ Limpieza completada:");
        $this->line("   - Cache: {$deletedCache} entradas");
        $this->line("   - Locks: {$deletedLocks} locks");
        $this->line("   - Jobs: {$deletedJobs} jobs");
        $this->line("   - Sessions: {$deletedSessions} sesiones");
        
        return Command::SUCCESS;
    }
}
