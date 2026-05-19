<?php

namespace App\Console\Commands\Media;

use App\Models\MediaFiles\MediaFile;
use Illuminate\Console\Command;

class FixReelMetadata extends Command
{
    protected $signature = 'reels:fix-metadata';
    protected $description = 'Fix metadata for existing reels to ensure ai_generated is set correctly';

    public function handle()
    {
        $this->info('🔍 Buscando reels sin metadata correcto...');
        $this->newLine();

        // Find all reels
        $allReels = MediaFile::where('file_type', 'reel')->get();
        
        $this->info("📊 Total de reels encontrados: {$allReels->count()}");
        $this->newLine();

        if ($allReels->isEmpty()) {
            $this->warn('No se encontraron reels en la base de datos');
            return 0;
        }

        $needsFix = [];
        $alreadyCorrect = [];

        foreach ($allReels as $reel) {
            $metadata = $reel->metadata ?? [];
            
            // Check if ai_generated is set correctly
            if (!isset($metadata['ai_generated']) || $metadata['ai_generated'] !== true) {
                $needsFix[] = $reel;
            } else {
                $alreadyCorrect[] = $reel;
            }
        }

        $this->info("✅ Reels con metadata correcto: " . count($alreadyCorrect));
        $this->warn("⚠️  Reels que necesitan corrección: " . count($needsFix));
        $this->newLine();

        if (empty($needsFix)) {
            $this->info('🎉 Todos los reels tienen el metadata correcto');
            return 0;
        }

        // Show reels that need fixing
        $this->info('Reels que se corregirán:');
        foreach ($needsFix as $reel) {
            $this->line("   - ID: {$reel->id} | {$reel->file_name}");
            $this->line("     Metadata actual: " . json_encode($reel->metadata));
        }
        $this->newLine();

        if (!$this->confirm('¿Deseas corregir el metadata de estos reels?', true)) {
            $this->info('Operación cancelada');
            return 0;
        }

        $fixed = 0;
        foreach ($needsFix as $reel) {
            $metadata = $reel->metadata ?? [];
            
            // Set ai_generated to true
            $metadata['ai_generated'] = true;
            
            // If generation_type is not set, add it
            if (!isset($metadata['generation_type'])) {
                $metadata['generation_type'] = 'ai_reel';
            }
            
            $reel->update(['metadata' => $metadata]);
            
            $this->info("✅ Corregido: {$reel->file_name} (ID: {$reel->id})");
            $fixed++;
        }

        $this->newLine();
        $this->info("🎉 Se corrigieron {$fixed} reels");
        $this->info('Ahora deberían aparecer en la sección "Reels Generados con IA"');
        
        return 0;
    }
}
