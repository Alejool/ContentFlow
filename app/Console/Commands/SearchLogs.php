<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class SearchLogs extends Command
{
    protected $signature = 'logs:search 
                            {term : Término de búsqueda}
                            {--channel=laravel : Canal de log (laravel, publications, jobs, auth, social, errors)}
                            {--user= : ID del usuario}
                            {--date= : Fecha específica (YYYY-MM-DD)}
                            {--level= : Nivel de log (info, error, warning, debug)}
                            {--lines=50 : Número de líneas a mostrar}';

    protected $description = 'Buscar en los logs de forma fácil y organizada';

    public function handle()
    {
        $term = $this->argument('term');
        $channel = $this->option('channel');
        $userId = $this->option('user');
        $date = $this->option('date');
        $level = $this->option('level');
        $maxLines = (int) $this->option('lines');

        // Construir el nombre del archivo
        $logFile = $date 
            ? "{$channel}-{$date}.log" 
            : "{$channel}.log";

        $logPath = storage_path("logs/{$logFile}");

        if (!File::exists($logPath)) {
            $this->error("❌ Log file not found: {$logPath}");
            $this->info(" Available logs:");
            
            $logs = File::glob(storage_path('logs/*.log'));
            foreach ($logs as $log) {
                $this->line("   - " . basename($log));
            }
            
            return 1;
        }

        $this->info("🔍 Searching in: {$logFile}");
        $this->newLine();

        $lines = file($logPath);
        $results = [];
        $currentEntry = '';

        foreach ($lines as $lineNum => $line) {
            // Detectar inicio de nueva entrada de log
            if (preg_match('/^\[\d{4}-\d{2}-\d{2}/', $line)) {
                if ($currentEntry && $this->matchesFilters($currentEntry, $term, $userId, $level)) {
                    $results[] = $currentEntry;
                }
                $currentEntry = $line;
            } else {
                $currentEntry .= $line;
            }

            // Limitar resultados
            if (count($results) >= $maxLines) {
                break;
            }
        }

        // Agregar última entrada
        if ($currentEntry && $this->matchesFilters($currentEntry, $term, $userId, $level)) {
            $results[] = $currentEntry;
        }

        if (empty($results)) {
            $this->warn("⚠️  No results found");
            return 0;
        }

        $this->info("✅ Found " . count($results) . " results:");
        $this->newLine();

        foreach ($results as $index => $result) {
            $this->line("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            $this->line($result);
        }

        return 0;
    }

    private function matchesFilters(string $entry, string $term, ?string $userId, ?string $level): bool
    {
        // Buscar término
        if (!str_contains(strtolower($entry), strtolower($term))) {
            return false;
        }

        // Filtrar por usuario
        if ($userId && !str_contains($entry, "\"user_id\":{$userId}")) {
            return false;
        }

        // Filtrar por nivel
        if ($level && !str_contains($entry, strtoupper($level))) {
            return false;
        }

        return true;
    }
}
