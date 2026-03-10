<?php

namespace App\Console\Commands;

use App\Models\MediaFiles\MediaFile;
use App\Models\MediaFiles\MediaDerivative;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Storage\S3PathService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MigrateS3Structure extends Command
{
    protected $signature = 'storage:migrate-s3-structure 
                            {--dry-run : Simular la migración sin mover archivos}
                            {--limit= : Limitar el número de archivos a migrar}
                            {--type= : Tipo de archivo a migrar (avatars|publications|derivatives|branding)}';

    protected $description = 'Migra archivos de S3 a la nueva estructura organizada por workspace y usuario';

    private int $movedCount = 0;
    private int $errorCount = 0;
    private int $skippedCount = 0;

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $type = $this->option('type');

        $this->info('🚀 Iniciando migración de estructura S3...');
        if ($dryRun) {
            $this->warn('⚠️  Modo DRY-RUN activado - No se moverán archivos realmente');
        }

        // Migrar según el tipo especificado o todos
        if (!$type || $type === 'avatars') {
            $this->migrateAvatars($dryRun, $limit);
        }

        if (!$type || $type === 'publications') {
            $this->migratePublications($dryRun, $limit);
        }

        if (!$type || $type === 'derivatives') {
            $this->migrateDerivatives($dryRun, $limit);
        }

        if (!$type || $type === 'branding') {
            $this->migrateBranding($dryRun, $limit);
        }

        // Resumen
        $this->newLine();
        $this->info('📊 Resumen de migración:');
        $this->table(
            ['Métrica', 'Cantidad'],
            [
                ['Archivos movidos', $this->movedCount],
                ['Archivos omitidos', $this->skippedCount],
                ['Errores', $this->errorCount],
            ]
        );

        return $this->errorCount > 0 ? 1 : 0;
    }

    private function migrateAvatars(bool $dryRun, ?int $limit): void
    {
        $this->info('👤 Migrando avatares...');

        $users = User::whereNotNull('photo_url')
            ->where('photo_url', 'like', '%s3.amazonaws.com%')
            ->when($limit, fn($q) => $q->limit($limit))
            ->get();

        $bar = $this->output->createProgressBar($users->count());

        foreach ($users as $user) {
            try {
                $oldUrl = $user->photo_url;
                $oldPath = parse_url($oldUrl, PHP_URL_PATH);
                $oldPath = ltrim($oldPath, '/');

                // Si ya está en la nueva estructura, omitir
                if (str_starts_with($oldPath, 'avatars/' . $user->id . '/')) {
                    $this->skippedCount++;
                    $bar->advance();
                    continue;
                }

                // Generar nueva ruta
                $extension = pathinfo($oldPath, PATHINFO_EXTENSION) ?: 'png';
                $newPath = S3PathService::avatarPath($user->id, $extension);

                if (!$dryRun) {
                    // Copiar archivo a nueva ubicación
                    if (Storage::disk('s3')->exists($oldPath)) {
                        Storage::disk('s3')->copy($oldPath, $newPath);
                        
                        // Actualizar URL en base de datos
                        $user->photo_url = Storage::disk('s3')->url($newPath);
                        $user->save();

                        // Eliminar archivo antiguo
                        Storage::disk('s3')->delete($oldPath);
                        
                        $this->movedCount++;
                    } else {
                        $this->skippedCount++;
                    }
                } else {
                    $this->line("  [DRY-RUN] {$oldPath} -> {$newPath}");
                    $this->movedCount++;
                }
            } catch (\Exception $e) {
                $this->errorCount++;
                Log::error('Error migrando avatar', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    private function migratePublications(bool $dryRun, ?int $limit): void
    {
        $this->info('📄 Migrando publicaciones...');

        $mediaFiles = MediaFile::whereNotNull('file_path')
            ->where('file_path', 'like', 'publications/%')
            ->whereNotNull('workspace_id')
            ->whereNotNull('user_id')
            ->when($limit, fn($q) => $q->limit($limit))
            ->get();

        $bar = $this->output->createProgressBar($mediaFiles->count());

        foreach ($mediaFiles as $media) {
            try {
                $oldPath = $media->getRawOriginal('file_path');

                // Si ya está en la nueva estructura, omitir
                if (str_starts_with($oldPath, 'workspaces/')) {
                    $this->skippedCount++;
                    $bar->advance();
                    continue;
                }

                // Generar nueva ruta
                $extension = pathinfo($oldPath, PATHINFO_EXTENSION);
                $newPath = S3PathService::publicationPath(
                    $media->workspace_id,
                    $media->user_id,
                    $extension
                );

                if (!$dryRun) {
                    if (Storage::disk('s3')->exists($oldPath)) {
                        Storage::disk('s3')->copy($oldPath, $newPath);
                        
                        // Actualizar path en base de datos
                        $media->update(['file_path' => $newPath]);

                        // Eliminar archivo antiguo
                        Storage::disk('s3')->delete($oldPath);
                        
                        $this->movedCount++;
                    } else {
                        $this->skippedCount++;
                    }
                } else {
                    $this->line("  [DRY-RUN] {$oldPath} -> {$newPath}");
                    $this->movedCount++;
                }
            } catch (\Exception $e) {
                $this->errorCount++;
                Log::error('Error migrando publicación', [
                    'media_id' => $media->id,
                    'error' => $e->getMessage()
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    private function migrateDerivatives(bool $dryRun, ?int $limit): void
    {
        $this->info('🖼️  Migrando derivatives...');

        $derivatives = MediaDerivative::whereNotNull('file_path')
            ->where('file_path', 'like', 'derivatives/%')
            ->with('mediaFile')
            ->when($limit, fn($q) => $q->limit($limit))
            ->get();

        $bar = $this->output->createProgressBar($derivatives->count());

        foreach ($derivatives as $derivative) {
            try {
                if (!$derivative->mediaFile) {
                    $this->skippedCount++;
                    $bar->advance();
                    continue;
                }

                $oldPath = $derivative->getRawOriginal('file_path');

                // Si ya está en la nueva estructura, omitir
                if (str_starts_with($oldPath, 'workspaces/')) {
                    $this->skippedCount++;
                    $bar->advance();
                    continue;
                }

                $media = $derivative->mediaFile;
                $filename = basename($oldPath);
                
                // Determinar tipo de derivative
                $type = 'optimized';
                if (str_contains($oldPath, 'thumbnails')) {
                    $type = 'thumbnails';
                }

                // Generar nueva ruta
                $newPath = S3PathService::derivativePath(
                    $media->workspace_id,
                    $media->user_id,
                    $media->publication_id,
                    $type,
                    $filename
                );

                if (!$dryRun) {
                    if (Storage::disk('s3')->exists($oldPath)) {
                        Storage::disk('s3')->copy($oldPath, $newPath);
                        
                        // Actualizar path en base de datos
                        $derivative->update(['file_path' => $newPath]);

                        // Eliminar archivo antiguo
                        Storage::disk('s3')->delete($oldPath);
                        
                        $this->movedCount++;
                    } else {
                        $this->skippedCount++;
                    }
                } else {
                    $this->line("  [DRY-RUN] {$oldPath} -> {$newPath}");
                    $this->movedCount++;
                }
            } catch (\Exception $e) {
                $this->errorCount++;
                Log::error('Error migrando derivative', [
                    'derivative_id' => $derivative->id,
                    'error' => $e->getMessage()
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    private function migrateBranding(bool $dryRun, ?int $limit): void
    {
        $this->info('🎨 Migrando branding de workspaces...');

        $workspaces = Workspace::where(function($q) {
            $q->whereNotNull('white_label_logo_url')
              ->orWhereNotNull('white_label_favicon_url');
        })
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();

        $bar = $this->output->createProgressBar($workspaces->count());

        foreach ($workspaces as $workspace) {
            try {
                // Migrar logo
                if ($workspace->white_label_logo_url && str_contains($workspace->white_label_logo_url, 'workspace-branding')) {
                    $oldUrl = $workspace->white_label_logo_url;
                    $oldPath = parse_url($oldUrl, PHP_URL_PATH);
                    $oldPath = ltrim($oldPath, '/');

                    if (!str_starts_with($oldPath, 'workspaces/')) {
                        $extension = pathinfo($oldPath, PATHINFO_EXTENSION) ?: 'png';
                        $newPath = S3PathService::workspaceBrandingPath($workspace->id, "logo_{$workspace->id}.{$extension}");

                        if (!$dryRun) {
                            if (Storage::disk('s3')->exists($oldPath)) {
                                Storage::disk('s3')->copy($oldPath, $newPath);
                                $workspace->white_label_logo_url = Storage::disk('s3')->url($newPath);
                                Storage::disk('s3')->delete($oldPath);
                                $this->movedCount++;
                            }
                        } else {
                            $this->line("  [DRY-RUN] {$oldPath} -> {$newPath}");
                            $this->movedCount++;
                        }
                    }
                }

                // Migrar favicon
                if ($workspace->white_label_favicon_url && str_contains($workspace->white_label_favicon_url, 'workspace-branding')) {
                    $oldUrl = $workspace->white_label_favicon_url;
                    $oldPath = parse_url($oldUrl, PHP_URL_PATH);
                    $oldPath = ltrim($oldPath, '/');

                    if (!str_starts_with($oldPath, 'workspaces/')) {
                        $extension = pathinfo($oldPath, PATHINFO_EXTENSION) ?: 'ico';
                        $newPath = S3PathService::workspaceBrandingPath($workspace->id, "favicon_{$workspace->id}.{$extension}");

                        if (!$dryRun) {
                            if (Storage::disk('s3')->exists($oldPath)) {
                                Storage::disk('s3')->copy($oldPath, $newPath);
                                $workspace->white_label_favicon_url = Storage::disk('s3')->url($newPath);
                                Storage::disk('s3')->delete($oldPath);
                                $this->movedCount++;
                            }
                        } else {
                            $this->line("  [DRY-RUN] {$oldPath} -> {$newPath}");
                            $this->movedCount++;
                        }
                    }
                }

                if (!$dryRun && $workspace->isDirty()) {
                    $workspace->save();
                }
            } catch (\Exception $e) {
                $this->errorCount++;
                Log::error('Error migrando branding', [
                    'workspace_id' => $workspace->id,
                    'error' => $e->getMessage()
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }
}
