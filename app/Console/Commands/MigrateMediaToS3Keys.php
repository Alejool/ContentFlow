<?php

namespace App\Console\Commands;

use App\Models\MediaFiles\MediaFile;
use App\Services\Storage\S3PathService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Comando para migrar datos existentes de URLs públicas a s3_key
 * 
 * Uso:
 * php artisan migrate:media-to-s3-keys
 * 
 * Este comando:
 * 1. Obtiene MediaFiles sin s3_key
 * 2. Intenta extraer s3_key del file_path existente
 * 3. Si file_path ya es una s3_key, la usa
 * 4. Si file_path es una URL, la convierte
 * 5. Genera s3_key nueva si no puede extraer
 */
class MigrateMediaToS3Keys extends Command
{
    protected $signature = 'migrate:media-to-s3-keys {--dry-run : Simular migración sin hacer cambios}';

    protected $description = 'Migrar archivos de MediaFile para usar s3_key en lugar de URLs públicas';

    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No se harán cambios en la BD');
        }

        // Obtener archivos sin s3_key
        $mediaFiles = MediaFile::whereNull('s3_key')
            ->orWhere('s3_key', '')
            ->get();

        $this->info("📁 Encontrados {$mediaFiles->count()} archivos para migrar");

        if ($mediaFiles->isEmpty()) {
            $this->info('✅ No hay archivos para migrar');
            return 0;
        }

        $successful = 0;
        $failed = 0;
        $skipped = 0;

        foreach ($mediaFiles as $mediaFile) {
            try {
                $s3Key = $this->extractOrGenerateS3Key($mediaFile);

                if (!$s3Key) {
                    $this->warn("⏭️  Saltado: MediaFile #{$mediaFile->id} - no se pudo generar s3_key");
                    $skipped++;
                    continue;
                }

                if (!$dryRun) {
                    $mediaFile->s3_key = $s3Key;
                    $mediaFile->save();
                }

                $this->line("✅ #{$mediaFile->id}: {$mediaFile->file_name} → {$s3Key}");
                $successful++;

            } catch (\Exception $e) {
                $this->error("❌ MediaFile #{$mediaFile->id}: {$e->getMessage()}");
                $failed++;
            }
        }

        // Resumen
        $this->newLine();
        $this->info('📊 RESUMEN DE MIGRACIÓN');
        $this->line("✅ Exitosos: {$successful}");
        $this->line("⏭️  Saltados: {$skipped}");
        $this->line("❌ Fallidos: {$failed}");

        if ($dryRun) {
            $this->warn('🔍 Modo dry-run: cambios no guardados. Ejecuta sin --dry-run para aplicar');
        }

        return 0;
    }

    /**
     * Extrae o genera s3_key a partir del file_path existente
     * 
     * @return string|null
     */
    private function extractOrGenerateS3Key(MediaFile $mediaFile): ?string
    {
        // Si file_path ya es una s3_key válida, usarla
        if ($this->isValidS3Key($mediaFile->file_path)) {
            return $mediaFile->file_path;
        }

        // Si file_path parece una URL pública S3, intentar extraer s3_key
        if ($this->isPublicS3Url($mediaFile->file_path)) {
            $extractedKey = $this->extractKeyFromUrl($mediaFile->file_path);
            if ($extractedKey) {
                return $extractedKey;
            }
        }

        // Si tenemos workspace_id y user_id, generar nueva s3_key
        if ($mediaFile->workspace_id && $mediaFile->user_id) {
            return $this->generateNewS3Key($mediaFile);
        }

        return null;
    }

    /**
     * Valida si un string es una s3_key válida
     * Patrón: workspaces/{id}/users/{id}/... o avatars/{id}/... etc
     */
    private function isValidS3Key(string $path): bool
    {
        return preg_match(
            '#^(workspaces/\d+/users/\d+/|avatars/\d+/)#',
            $path
        ) === 1;
    }

    /**
     * Verifica si un path es una URL pública S3
     */
    private function isPublicS3Url(string $path): bool
    {
        return str_starts_with($path, 'http')
            && str_contains($path, 's3')
            && str_contains($path, 'amazonaws.com');
    }

    /**
     * Extrae la s3_key de una URL pública S3
     * 
     * Ejemplo:
     * https://intellipost.s3.amazonaws.com/workspaces/7/file.mp4
     * → workspaces/7/file.mp4
     */
    private function extractKeyFromUrl(string $url): ?string
    {
        // Patrón: https://bucket.s3.amazonaws.com/key
        if (preg_match('#amazonaws\.com/(.+)$#', $url, $matches)) {
            return urldecode($matches[1]);
        }

        // Patrón: https://s3.amazonaws.com/bucket/key
        if (preg_match('#s3\.amazonaws\.com/[^/]+/(.+)$#', $url, $matches)) {
            return urldecode($matches[1]);
        }

        return null;
    }

    /**
     * Genera una nueva s3_key basada en metadata del archivo
     */
    private function generateNewS3Key(MediaFile $mediaFile): string
    {
        $extension = $this->getFileExtension($mediaFile->file_name);
        $uuid = Str::uuid();

        // Estructura: workspaces/{id}/users/{id}/publications/{uuid}.{ext}
        return "workspaces/{$mediaFile->workspace_id}/users/{$mediaFile->user_id}/publications/{$uuid}.{$extension}";
    }

    /**
     * Extrae extensión de un nombre de archivo
     */
    private function getFileExtension(string $fileName): string
    {
        $parts = explode('.', $fileName);
        return strtolower(end($parts)) ?: 'unknown';
    }
}
