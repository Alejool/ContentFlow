<?php

namespace App\Console\Commands;

use App\Helpers\LogHelper;
use Illuminate\Console\Command;

class AnalyzeLogsCommand extends Command
{
    protected $signature = 'logs:analyze 
                            {module : El módulo a analizar (uploads, publications, campaigns, etc.)}
                            {--user= : Filtrar por ID de usuario}
                            {--workspace= : Filtrar por ID de workspace}
                            {--trace= : Filtrar por Trace ID}
                            {--action= : Filtrar por acción específica}
                            {--stats : Mostrar estadísticas generales}';

    protected $description = 'Analizar logs estructurados por módulo';

    public function handle()
    {
        $module = $this->argument('module');
        $userId = $this->option('user');
        $workspaceId = $this->option('workspace');
        $traceId = $this->option('trace');
        $action = $this->option('action');
        $showStats = $this->option('stats');

        $this->info("📊 Analizando logs de: {$module}");
        $this->newLine();

        // Mostrar estadísticas
        if ($showStats) {
            $this->showStats($module);
            return 0;
        }

        // Buscar por filtros
        $logs = [];

        if ($userId) {
            $this->info("🔍 Buscando logs del usuario: {$userId}");
            $logs = LogHelper::searchByUser($userId, $module);
        } elseif ($workspaceId) {
            $this->info("🔍 Buscando logs del workspace: {$workspaceId}");
            $logs = LogHelper::searchByWorkspace($workspaceId, $module);
        } elseif ($traceId) {
            $this->info("🔍 Buscando logs del trace: {$traceId}");
            $logs = LogHelper::searchByTraceId($traceId, $module);
        } elseif ($action) {
            $this->info("🔍 Buscando logs de la acción: {$action}");
            $logs = LogHelper::searchByAction($action, $module);
        } else {
            $this->error('❌ Debes especificar al menos un filtro: --user, --workspace, --trace, --action o --stats');
            return 1;
        }

        // Mostrar resultados
        $this->newLine();
        $this->info("✅ Encontrados: " . count($logs) . " logs");
        $this->newLine();

        if (empty($logs)) {
            $this->warn('No se encontraron logs con los filtros especificados.');
            return 0;
        }

        // Mostrar logs
        foreach ($logs as $index => $log) {
            if (is_array($log)) {
                $this->displayLog($log, $index + 1);
            } else {
                $this->line($log);
            }
        }

        return 0;
    }

    protected function showStats(string $module): void
    {
        $stats = LogHelper::getStats($module);

        if (empty($stats)) {
            $this->warn("No hay estadísticas disponibles para el módulo: {$module}");
            return;
        }

        $this->info("📈 Estadísticas de {$module}:");
        $this->newLine();

        // Total
        $this->line("Total de logs: <fg=cyan>{$stats['total']}</>");
        $this->newLine();

        // Por nivel
        if (!empty($stats['by_level'])) {
            $this->line("<fg=yellow>Por nivel:</>");
            $levelData = [];
            foreach ($stats['by_level'] as $level => $count) {
                $levelData[] = [$level, $count, $this->getPercentage($count, $stats['total'])];
            }
            $this->table(['Nivel', 'Cantidad', 'Porcentaje'], $levelData);
            $this->newLine();
        }

        // Por módulo
        if (!empty($stats['by_module'])) {
            $this->line("<fg=yellow>Por módulo:</>");
            $moduleData = [];
            foreach ($stats['by_module'] as $mod => $count) {
                $moduleData[] = [$mod, $count, $this->getPercentage($count, $stats['total'])];
            }
            $this->table(['Módulo', 'Cantidad', 'Porcentaje'], $moduleData);
            $this->newLine();
        }

        // Por acción (top 10)
        if (!empty($stats['by_action'])) {
            $this->line("<fg=yellow>Top 10 acciones:</>");
            arsort($stats['by_action']);
            $actionData = [];
            $count = 0;
            foreach ($stats['by_action'] as $action => $qty) {
                if ($count >= 10) break;
                $actionData[] = [$action, $qty, $this->getPercentage($qty, $stats['total'])];
                $count++;
            }
            $this->table(['Acción', 'Cantidad', 'Porcentaje'], $actionData);
        }
    }

    protected function displayLog(array $log, int $index): void
    {
        $this->line("<fg=cyan>─────────────────────────────────────────────────────────────</>");
        $this->line("<fg=green>Log #{$index}</>");
        $this->line("<fg=cyan>─────────────────────────────────────────────────────────────</>");

        // Información principal
        $timestamp = $log['timestamp'] ?? 'N/A';
        $level = strtoupper($log['level'] ?? 'INFO');
        $message = $log['message'] ?? 'N/A';

        $levelColor = match($level) {
            'ERROR' => 'red',
            'WARNING' => 'yellow',
            'INFO' => 'green',
            'DEBUG' => 'blue',
            default => 'white',
        };

        $this->line("Timestamp: <fg=white>{$timestamp}</>");
        $this->line("Nivel: <fg={$levelColor}>{$level}</>");
        $this->line("Mensaje: <fg=white>{$message}</>");

        // Contexto
        if (isset($log['trace_id'])) {
            $this->line("Trace ID: <fg=magenta>{$log['trace_id']}</>");
        }
        if (isset($log['user_id'])) {
            $this->line("Usuario: <fg=cyan>{$log['user_id']}</>");
        }
        if (isset($log['workspace_id'])) {
            $this->line("Workspace: <fg=cyan>{$log['workspace_id']}</>");
        }
        if (isset($log['module'])) {
            $this->line("Módulo: <fg=yellow>{$log['module']}</>");
        }
        if (isset($log['action'])) {
            $this->line("Acción: <fg=yellow>{$log['action']}</>");
        }

        // Datos adicionales
        $excludeKeys = ['timestamp', 'level', 'message', 'trace_id', 'user_id', 'workspace_id', 'module', 'action', 'ip', 'url', 'method', 'user_agent'];
        $additionalData = array_diff_key($log, array_flip($excludeKeys));

        if (!empty($additionalData)) {
            $this->newLine();
            $this->line("<fg=yellow>Datos adicionales:</>");
            foreach ($additionalData as $key => $value) {
                if (is_array($value)) {
                    $value = json_encode($value, JSON_PRETTY_PRINT);
                }
                $this->line("  {$key}: {$value}");
            }
        }

        $this->newLine();
    }

    protected function getPercentage(int $count, int $total): string
    {
        if ($total === 0) return '0%';
        return number_format(($count / $total) * 100, 2) . '%';
    }
}
