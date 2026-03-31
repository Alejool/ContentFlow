<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Social\SocialPostLog;
use App\Jobs\VerifyPlatformContentStatus;
use Illuminate\Support\Facades\Log;

/**
 * Comando para verificar periódicamente el estado de contenido publicado
 * Verifica si el contenido sigue existiendo en las plataformas
 */
class VerifyPublishedContent extends Command
{
    protected $signature = 'content:verify-status 
                            {--platform= : Verificar solo una plataforma específica}
                            {--days=7 : Verificar contenido publicado en los últimos X días}
                            {--limit=100 : Límite de contenidos a verificar por ejecución}';

    protected $description = 'Verifica el estado de contenido publicado en plataformas sociales';

    public function handle()
    {
        $platform = $this->option('platform');
        $days = (int) $this->option('days');
        $limit = (int) $this->option('limit');

        $this->info("🔍 Iniciando verificación de contenido publicado...");
        
        if ($platform) {
            $this->info("📱 Plataforma: {$platform}");
        }
        $this->info("📅 Últimos {$days} días");
        $this->info("📊 Límite: {$limit} contenidos");

        $query = SocialPostLog::query()
            ->where('status', 'published')
            ->whereNotNull('platform_post_id')
            ->where('published_at', '>=', now()->subDays($days))
            ->with(['socialAccount', 'publication']);

        if ($platform) {
            $query->where('platform', $platform);
        }

        $totalLogs = $query->count();
        $logs = $query->limit($limit)->get();

        $this->info("📦 Encontrados: {$totalLogs} contenidos publicados");
        $this->info("✅ Verificando: {$logs->count()} contenidos");

        $bar = $this->output->createProgressBar($logs->count());
        $bar->start();

        $dispatched = 0;
        $skipped = 0;
        $byPlatform = [];

        foreach ($logs as $log) {
            // Verificar que la cuenta social aún exista
            if (!$log->socialAccount) {
                $skipped++;
                $bar->advance();
                continue;
            }

            // Despachar job de verificación
            VerifyPlatformContentStatus::dispatch($log);
            $dispatched++;

            // Contar por plataforma
            $platform = $log->platform;
            $byPlatform[$platform] = ($byPlatform[$platform] ?? 0) + 1;

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✅ Verificación completada:");
        $this->table(
            ['Métrica', 'Valor'],
            [
                ['Total encontrados', $totalLogs],
                ['Jobs despachados', $dispatched],
                ['Omitidos', $skipped],
            ]
        );

        if (!empty($byPlatform)) {
            $this->newLine();
            $this->info("📊 Por plataforma:");
            $platformData = [];
            foreach ($byPlatform as $platform => $count) {
                $platformData[] = [ucfirst($platform), $count];
            }
            $this->table(['Plataforma', 'Cantidad'], $platformData);
        }

        Log::info('Content verification command completed', [
            'total' => $totalLogs,
            'dispatched' => $dispatched,
            'skipped' => $skipped,
            'by_platform' => $byPlatform
        ]);

        return Command::SUCCESS;
    }
}
