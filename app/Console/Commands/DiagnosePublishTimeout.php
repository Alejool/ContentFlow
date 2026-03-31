<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;
use App\Models\Publications\Publication;

class DiagnosePublishTimeout extends Command
{
    protected $signature = 'diagnose:publish-timeout {publication_id?}';
    protected $description = 'Diagnostica problemas de timeout en publicaciones';

    public function handle()
    {
        $this->info('🔍 Diagnóstico de Timeout en Publicaciones');
        $this->newLine();

        // 1. Verificar configuración
        $this->checkConfiguration();
        $this->newLine();

        // 2. Verificar workers
        $this->checkWorkers();
        $this->newLine();

        // 3. Si se proporciona ID, verificar publicación específica
        if ($publicationId = $this->argument('publication_id')) {
            $this->checkPublication($publicationId);
        }

        // 4. Verificar archivos pesados recientes
        $this->checkHeavyFiles();
    }

    private function checkConfiguration()
    {
        $this->info('📋 Configuración:');
        
        $timeout = config('queue.connections.redis.retry_after');
        $this->line("  Redis retry_after: {$timeout}s");
        
        $phpTimeout = ini_get('max_execution_time');
        $this->line("  PHP max_execution_time: {$phpTimeout}s");
        
        $memoryLimit = ini_get('memory_limit');
        $this->line("  PHP memory_limit: {$memoryLimit}");
        
        if ($timeout < 1800) {
            $this->warn('  ⚠️  Redis retry_after debería ser >= 2100s para archivos pesados');
        }
        
        if ($phpTimeout > 0 && $phpTimeout < 1800) {
            $this->warn('  ⚠️  PHP max_execution_time debería ser >= 1800s');
        }
    }

    private function checkWorkers()
    {
        $this->info('👷 Workers:');
        
        try {
            $workers = Redis::connection()->client()->list();
            $this->line("  Conexiones Redis activas: " . count($workers));
        } catch (\Exception $e) {
            $this->error("  ❌ No se pudo conectar a Redis: " . $e->getMessage());
        }
        
        // Verificar si hay jobs en cola
        try {
            $queueSize = Redis::connection()->llen('queues:default');
            $this->line("  Jobs en cola 'default': {$queueSize}");
            
            if ($queueSize > 100) {
                $this->warn("  ⚠️  Cola muy grande, considera agregar más workers");
            }
        } catch (\Exception $e) {
            $this->error("  ❌ Error al verificar cola: " . $e->getMessage());
        }
    }

    private function checkPublication($publicationId)
    {
        $this->info("📄 Publicación #{$publicationId}:");
        
        $publication = Publication::find($publicationId);
        
        if (!$publication) {
            $this->error("  ❌ Publicación no encontrada");
            return;
        }
        
        $this->line("  Estado: {$publication->status}");
        $this->line("  Título: {$publication->title}");
        
        if ($publication->media_path) {
            $filePath = storage_path('app/' . $publication->media_path);
            
            if (file_exists($filePath)) {
                $fileSize = filesize($filePath);
                $fileSizeMB = round($fileSize / 1024 / 1024, 2);
                $this->line("  Tamaño archivo: {$fileSizeMB} MB");
                
                // Detectar tipo de archivo
                $extension = pathinfo($filePath, PATHINFO_EXTENSION);
                $isVideo = in_array(strtolower($extension), ['mp4', 'mov', 'avi', 'm4v']);
                
                if ($isVideo) {
                    $this->line("  Tipo: Video (.{$extension})");
                    
                    // Recomendaciones específicas por tamaño
                    if ($fileSizeMB > 500) {
                        $this->error("  ⚠️  Archivo MUY pesado (>500MB)");
                        $this->line("   Recomendación: Comprimir antes de publicar");
                        $this->line("     ffmpeg -i input.mp4 -c:v libx264 -crf 28 output.mp4");
                    } elseif ($fileSizeMB > 200) {
                        $this->warn("  ⚠️  Archivo pesado (>200MB)");
                        $this->line("   Facebook usará upload resumible (más lento pero confiable)");
                    } elseif ($fileSizeMB > 100) {
                        $this->line("  ℹ️  Facebook usará upload resumible");
                    } else {
                        $this->line("  ✅ Tamaño óptimo para upload directo");
                    }
                    
                    // Estimar tiempo de upload
                    $estimatedMinutes = $this->estimateUploadTime($fileSizeMB);
                    $this->line("  ⏱️  Tiempo estimado: ~{$estimatedMinutes} minutos");
                } else {
                    $this->line("  Tipo: Imagen (.{$extension})");
                }
                
            } else {
                $this->error("  ❌ Archivo no encontrado: {$filePath}");
            }
        } else {
            $this->line("  Sin archivo multimedia");
        }
        
        // Verificar logs de la publicación
        $logs = \App\Models\Social\SocialPostLog::where('publication_id', $publicationId)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
        
        if ($logs->isNotEmpty()) {
            $this->newLine();
            $this->line("  📝 Últimos intentos:");
            foreach ($logs as $log) {
                $statusIcon = $log->status === 'published' ? '✅' : 
                             ($log->status === 'failed' ? '❌' : '⏳');
                
                $this->line("    {$statusIcon} {$log->platform}: {$log->status} ({$log->created_at->diffForHumans()})");
                
                if ($log->error_message) {
                    $error = substr($log->error_message, 0, 100);
                    
                    // Detectar errores específicos de Facebook
                    if (str_contains($error, '504') || str_contains($error, 'timeout')) {
                        $this->line("      Error: Timeout (504)");
                        $this->line("       El video es muy pesado para Facebook");
                        $this->line("       Solución: Comprimir video o esperar reintento automático");
                    } elseif (str_contains($error, '503')) {
                        $this->line("      Error: Servicio no disponible (503)");
                        $this->line("       Facebook está temporalmente sobrecargado");
                    } else {
                        $this->line("      Error: {$error}");
                    }
                }
            }
        }
    }

    /**
     * Estimate upload time based on file size
     */
    private function estimateUploadTime(float $fileSizeMB): string
    {
        // Estimaciones conservadoras
        if ($fileSizeMB < 50) {
            return "2-5";
        } elseif ($fileSizeMB < 100) {
            return "5-10";
        } elseif ($fileSizeMB < 200) {
            return "10-20";
        } elseif ($fileSizeMB < 500) {
            return "20-40";
        } else {
            return "40-60+";
        }
    }

    private function checkHeavyFiles()
    {
        $this->info('📦 Publicaciones con archivos pesados (últimas 24h):');
        
        $publications = Publication::where('created_at', '>=', now()->subDay())
            ->whereNotNull('media_path')
            ->get();
        
        $heavyFiles = [];
        
        foreach ($publications as $pub) {
            $filePath = storage_path('app/' . $pub->media_path);
            if (file_exists($filePath)) {
                $fileSize = filesize($filePath);
                $fileSizeMB = round($fileSize / 1024 / 1024, 2);
                
                if ($fileSizeMB > 50) {
                    $heavyFiles[] = [
                        'id' => $pub->id,
                        'size' => $fileSizeMB,
                        'status' => $pub->status,
                        'created' => $pub->created_at->diffForHumans()
                    ];
                }
            }
        }
        
        if (empty($heavyFiles)) {
            $this->line('  ✅ No hay archivos pesados recientes');
        } else {
            foreach ($heavyFiles as $file) {
                $this->line("  - ID {$file['id']}: {$file['size']} MB ({$file['status']}) - {$file['created']}");
            }
        }
    }
}
