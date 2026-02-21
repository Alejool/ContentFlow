<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class LogStats extends Command
{
    protected $signature = 'logs:stats 
                            {--channel=laravel : Canal de log}
                            {--date= : Fecha específica (YYYY-MM-DD)}';

    protected $description = 'Ver estadísticas de logs (errores por usuario, publicaciones, etc.)';

    public function handle()
    {
        $channel = $this->option('channel');
        $date = $this->option('date');

        $logFile = $date 
            ? "{$channel}-{$date}.log" 
            : "{$channel}.log";

        $logPath = storage_path("logs/{$logFile}");

        if (!File::exists($logPath)) {
            $this->error("❌ Log file not found: {$logPath}");
            return 1;
        }

        $this->info("📊 Log Statistics: {$logFile}");
        $this->newLine();

        $content = file_get_contents($logPath);
        
        // Contar por nivel
        $levels = [
            'ERROR' => substr_count($content, '.ERROR:'),
            'WARNING' => substr_count($content, '.WARNING:'),
            'INFO' => substr_count($content, '.INFO:'),
            'DEBUG' => substr_count($content, '.DEBUG:'),
        ];

        $this->table(
            ['Level', 'Count'],
            collect($levels)->map(fn($count, $level) => [$level, $count])->toArray()
        );

        // Extraer usuarios únicos
        preg_match_all('/"user_id":(\d+)/', $content, $userMatches);
        $uniqueUsers = array_unique($userMatches[1]);
        
        $this->newLine();
        $this->info("👥 Unique users in logs: " . count($uniqueUsers));

        if (count($uniqueUsers) > 0 && count($uniqueUsers) <= 10) {
            $this->line("   User IDs: " . implode(', ', $uniqueUsers));
        }

        // Extraer publicaciones únicas
        preg_match_all('/"publication_id":(\d+)/', $content, $pubMatches);
        $uniquePubs = array_unique($pubMatches[1]);
        
        $this->info("📝 Unique publications: " . count($uniquePubs));

        // Tamaño del archivo
        $fileSize = File::size($logPath);
        $this->info("💾 File size: " . $this->formatBytes($fileSize));

        return 0;
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
