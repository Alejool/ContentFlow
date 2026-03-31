<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

/**
 * Servicio para análisis avanzado de logs
 */
class LogAnalyzerService
{
    /**
     * Analizar logs por rango de fechas
     */
    public function analyzeByDateRange(string $module, string $startDate, string $endDate): array
    {
        $logs = $this->getLogsByDateRange($module, $startDate, $endDate);
        
        return [
            'total' => count($logs),
            'by_level' => $this->groupByLevel($logs),
            'by_action' => $this->groupByAction($logs),
            'by_user' => $this->groupByUser($logs),
            'by_workspace' => $this->groupByWorkspace($logs),
            'errors' => $this->getErrors($logs),
        ];
    }

    /**
     * Obtener logs por rango de fechas
     */
    protected function getLogsByDateRange(string $module, string $startDate, string $endDate): array
    {
        $logs = [];
        $start = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);
        
        while ($start->lte($end)) {
            $filename = storage_path("logs/{$module}-{$start->format('Y-m-d')}.log");
            
            if (File::exists($filename)) {
                $lines = file($filename);
                foreach ($lines as $line) {
                    $data = json_decode($line, true);
                    if ($data) {
                        $logs[] = $data;
                    }
                }
            }
            
            $start->addDay();
        }
        
        return $logs;
    }

    /**
     * Agrupar por nivel
     */
    protected function groupByLevel(array $logs): array
    {
        $grouped = [];
        foreach ($logs as $log) {
            $level = $log['level'] ?? 'unknown';
            $grouped[$level] = ($grouped[$level] ?? 0) + 1;
        }
        return $grouped;
    }

    /**
     * Agrupar por acción
     */
    protected function groupByAction(array $logs): array
    {
        $grouped = [];
        foreach ($logs as $log) {
            if (isset($log['action'])) {
                $action = $log['action'];
                $grouped[$action] = ($grouped[$action] ?? 0) + 1;
            }
        }
        arsort($grouped);
        return $grouped;
    }

    /**
     * Agrupar por usuario
     */
    protected function groupByUser(array $logs): array
    {
        $grouped = [];
        foreach ($logs as $log) {
            if (isset($log['user_id'])) {
                $userId = $log['user_id'];
                $grouped[$userId] = ($grouped[$userId] ?? 0) + 1;
            }
        }
        arsort($grouped);
        return $grouped;
    }

    /**
     * Agrupar por workspace
     */
    protected function groupByWorkspace(array $logs): array
    {
        $grouped = [];
        foreach ($logs as $log) {
            if (isset($log['workspace_id'])) {
                $workspaceId = $log['workspace_id'];
                $grouped[$workspaceId] = ($grouped[$workspaceId] ?? 0) + 1;
            }
        }
        arsort($grouped);
        return $grouped;
    }

    /**
     * Obtener solo errores
     */
    protected function getErrors(array $logs): array
    {
        return array_filter($logs, function($log) {
            return isset($log['level']) && in_array($log['level'], ['error', 'critical', 'alert', 'emergency']);
        });
    }

    /**
     * Obtener flujo completo por Trace ID
     */
    public function getFlowByTraceId(string $traceId): array
    {
        $modules = ['uploads', 'publications', 'campaigns', 'billing', 'api', 'jobs', 'auth', 'social', 'errors'];
        $flow = [];
        
        foreach ($modules as $module) {
            $logPath = storage_path("logs/{$module}.log");
            
            if (File::exists($logPath)) {
                $lines = file($logPath);
                foreach ($lines as $line) {
                    $data = json_decode($line, true);
                    if ($data && isset($data['trace_id']) && $data['trace_id'] === $traceId) {
                        $flow[] = $data;
                    }
                }
            }
        }
        
        // Ordenar por timestamp
        usort($flow, function($a, $b) {
            return strcmp($a['timestamp'] ?? '', $b['timestamp'] ?? '');
        });
        
        return $flow;
    }
}
