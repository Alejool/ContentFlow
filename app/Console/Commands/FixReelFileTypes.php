<?php

namespace App\Console\Commands;

use App\Models\MediaFiles\MediaFile;
use Illuminate\Console\Command;

class FixReelFileTypes extends Command
{
    protected $signature = 'reels:fix-file-types';
    protected $description = 'Fix file_type for AI-generated reels that were incorrectly saved as video';

    public function handle()
    {
        $this->info('🔍 Buscando reels con file_type incorrecto...');

        // Find media files that have reel metadata but wrong file_type
        $incorrectReels = MediaFile::where(function ($query) {
            $query->whereJsonContains('metadata->generation_type', 'ai_reel')
                  ->orWhereJsonContains('metadata->ai_generated', true)
                  ->orWhereNotNull('metadata->original_media_id');
        })
        ->where('file_type', '!=', 'reel')
        ->get();

        if ($incorrectReels->isEmpty()) {
            $this->info('✅ No se encontraron reels con file_type incorrecto');
            
            // Show current reels
            $this->info("\n📊 Reels actuales en la base de datos:");
            $currentReels = MediaFile::where('file_type', 'reel')->get();
            
            if ($currentReels->isEmpty()) {
                $this->warn('   No hay reels con file_type="reel"');
            } else {
                foreach ($currentReels as $reel) {
                    $this->line("   - ID: {$reel->id} | {$reel->file_name} | Status: {$reel->status}");
                }
            }
            
            return 0;
        }

        $this->info("📝 Encontrados {$incorrectReels->count()} archivos para corregir:\n");

        foreach ($incorrectReels as $media) {
            $this->line("   ID: {$media->id}");
            $this->line("   Nombre: {$media->file_name}");
            $this->line("   file_type actual: {$media->file_type}");
            $this->line("   Metadata: " . json_encode($media->metadata));
            $this->line("");
        }

        if (!$this->confirm('¿Deseas corregir el file_type de estos archivos a "reel"?')) {
            $this->info('Operación cancelada');
            return 0;
        }

        $fixed = 0;
        foreach ($incorrectReels as $media) {
            $media->update(['file_type' => 'reel']);
            $this->info("✅ Corregido: {$media->file_name} (ID: {$media->id})");
            $fixed++;
        }

        $this->info("\n🎉 Se corrigieron {$fixed} archivos");
        
        return 0;
    }
}
