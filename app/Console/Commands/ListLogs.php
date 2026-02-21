<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class ListLogs extends Command
{
    protected $signature = 'logs:list {--channel= : Filtrar por canal específico}';

    protected $description = 'Listar todos los archivos de log disponibles';

    public function handle()
    {
        $channel = $this->option('channel');
        
        $this->info("📋 Available Log Files\n");

        $logs = File::glob(storage_path('logs/*.log'));
        
        if (empty($logs)) {
            $this->warn("No log files found");
            return 0;
        }

        // Agrupar por canal
        $grouped = [];
        foreach ($logs as $log) {
            $filename = basename($log);
            
            // Extraer canal y fecha
            if (preg_match('/^(.+?)-(\d{4}-\d{2}-\d{2})\.log$/', $filename, $matches)) {
                $logChannel = $matches[1];
                $date = $matches[2];
            } else {
                $logChannel = str_replace('.log', '', $filename);
                $date = 'current';
            }
            
            // Filtrar por canal si se especificó
            if ($channel && $logChannel !== $channel) {
                continue;
            }
            
            if (!isset($grouped[$logChannel])) {
                $grouped[$logChannel] = [];
            }
            
            $size = File::size($log);
            $modified = Carbon::createFromTimestamp(File::lastModified($log));
            
            $grouped[$logChannel][] = [
                'filename' => $filename,
                'date' => $date,
                'size' => $this->formatBytes($size),
                'modified' => $modified->diffForHumans(),
                'path' => $log
            ];
        }

        // Mostrar agrupado por canal
        foreach ($grouped as $logChannel => $files) {
            $this->line("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            $this->info("📁 Channel: {$logChannel}");
            $this->line("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            
            // Ordenar por fecha descendente
            usort($files, function($a, $b) {
                return strcmp($b['date'], $a['date']);
            });
            
            $this->table(
                ['Date', 'Size', 'Modified', 'Filename'],
                array_map(function($file) {
                    return [
                        $file['date'],
                        $file['size'],
                        $file['modified'],
                        $file['filename']
                    ];
                }, $files)
            );
            
            $this->newLine();
        }

        $totalSize = array_sum(array_map(fn($log) => File::size($log), $logs));
        $this->info("💾 Total size: " . $this->formatBytes($totalSize));
        $this->info("📊 Total files: " . count($logs));

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
