<?php

namespace App\Console\Commands;

use App\Models\MediaFiles\MediaFile;
use Illuminate\Console\Command;

class DiagnoseReels extends Command
{
    protected $signature = 'reels:diagnose';
    protected $description = 'Diagnose reel issues in the database';

    public function handle()
    {
        $this->info('=== DIAGNÓSTICO DE REELS ===');
        $this->newLine();

        // 1. Count reels with correct file_type
        $correctReels = MediaFile::where('file_type', 'reel')->count();
        $this->info("1. Archivos con file_type='reel': {$correctReels}");
        
        if ($correctReels > 0) {
            $reels = MediaFile::where('file_type', 'reel')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();
            
            foreach ($reels as $reel) {
                $platform = $reel->metadata['platform'] ?? 'N/A';
                $originalId = $reel->metadata['original_media_id'] ?? 'N/A';
                $this->line("   - ID: {$reel->id} | {$reel->file_name}");
                $this->line("     Status: {$reel->status} | Platform: {$platform} | Original: {$originalId}");
            }
        }
        $this->newLine();

        // 2. Find files with reel metadata but wrong file_type
        $incorrectType = MediaFile::where(function ($query) {
            $query->whereJsonContains('metadata->generation_type', 'ai_reel')
                  ->orWhereJsonContains('metadata->ai_generated', true);
        })
        ->where('file_type', '!=', 'reel')
        ->count();
        
        $this->info("2. Archivos con metadata de reel pero file_type incorrecto: {$incorrectType}");
        
        if ($incorrectType > 0) {
            $files = MediaFile::where(function ($query) {
                $query->whereJsonContains('metadata->generation_type', 'ai_reel')
                      ->orWhereJsonContains('metadata->ai_generated', true);
            })
            ->where('file_type', '!=', 'reel')
            ->limit(5)
            ->get();
            
            foreach ($files as $file) {
                $this->line("   - ID: {$file->id} | {$file->file_name}");
                $this->line("     file_type: {$file->file_type} (debería ser 'reel')");
                $this->warn("     ⚠️ Este archivo necesita corrección");
            }
            
            $this->newLine();
            $this->warn("💡 Ejecuta 'php artisan reels:fix-file-types' para corregir estos archivos");
        }
        $this->newLine();

        // 3. Recent video files
        $recentVideos = MediaFile::where('file_type', 'video')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
        
        $this->info("3. Videos recientes (últimos 5):");
        foreach ($recentVideos as $video) {
            $aiGenerated = isset($video->metadata['ai_generated']) ? 'Sí' : 'No';
            $this->line("   - ID: {$video->id} | {$video->file_name}");
            $this->line("     AI Generated: {$aiGenerated} | Status: {$video->status}");
        }
        $this->newLine();

        // 4. Processing status
        $processing = MediaFile::where('status', 'processing')->count();
        $failed = MediaFile::where('status', 'failed')->count();
        
        $this->info("4. Estado de procesamiento:");
        $this->line("   - En proceso: {$processing}");
        $this->line("   - Fallidos: {$failed}");
        
        if ($failed > 0) {
            $failedFiles = MediaFile::where('status', 'failed')
                ->orderBy('updated_at', 'desc')
                ->limit(3)
                ->get();
            
            $this->newLine();
            $this->warn("   Archivos fallidos recientes:");
            foreach ($failedFiles as $file) {
                $error = $file->processing_error ?? 'Sin mensaje de error';
                $this->line("   - ID: {$file->id} | {$file->file_name}");
                $this->line("     Error: {$error}");
            }
        }

        $this->newLine();
        $this->info('=== FIN DEL DIAGNÓSTICO ===');
        
        return 0;
    }
}
