<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckFFmpegInstallation extends Command
{
    protected $signature = 'ffmpeg:check';
    protected $description = 'Check if FFmpeg and FFprobe are installed and accessible';

    public function handle()
    {
        $this->info('🔍 Verificando instalación de FFmpeg...');
        $this->newLine();

        // Check FFmpeg
        $ffmpegPath = config('media.ffmpeg_path', 'ffmpeg');
        $this->info("Ruta configurada de FFmpeg: {$ffmpegPath}");
        
        $command = sprintf('%s -version 2>&1', escapeshellcmd($ffmpegPath));
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0) {
            $this->info('✅ FFmpeg está instalado y accesible');
            $version = $output[0] ?? 'Versión desconocida';
            $this->line("   {$version}");
        } else {
            $this->error('❌ FFmpeg NO está instalado o no es accesible');
            $this->warn('   Salida: ' . implode("\n   ", $output));
            $this->newLine();
            $this->warn(' Para instalar FFmpeg en Windows:');
            $this->line('   1. Descarga desde: https://www.gyan.dev/ffmpeg/builds/');
            $this->line('   2. Extrae el archivo ZIP');
            $this->line('   3. Agrega la carpeta bin al PATH del sistema');
            $this->line('   4. O configura la ruta completa en config/media.php');
        }
        
        $this->newLine();

        // Check FFprobe
        $ffprobePath = config('media.ffprobe_path', 'ffprobe');
        $this->info("Ruta configurada de FFprobe: {$ffprobePath}");
        
        $command = sprintf('%s -version 2>&1', escapeshellcmd($ffprobePath));
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0) {
            $this->info('✅ FFprobe está instalado y accesible');
            $version = $output[0] ?? 'Versión desconocida';
            $this->line("   {$version}");
        } else {
            $this->error('❌ FFprobe NO está instalado o no es accesible');
            $this->warn('   FFprobe generalmente viene incluido con FFmpeg');
        }

        $this->newLine();
        
        if ($returnCode === 0) {
            $this->info('🎉 Todo está configurado correctamente para generar reels');
        } else {
            $this->error('⚠️ Necesitas instalar FFmpeg para generar reels');
        }

        return 0;
    }
}
