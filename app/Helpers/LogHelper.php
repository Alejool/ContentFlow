<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

/**
 * Helper centralizado para logging estructurado
 * Implementa las 5 preguntas clave: Qué, Dónde, Quién, En qué flujo, En qué paso
 */
class LogHelper
{
    /**
     * Agrega contexto automático a los logs
     * El middleware LogContextMiddleware ya agrega: trace_id, user_id, workspace_id, ip, url
     */
    private static function getContext(array $additionalContext = []): array
    {
        return array_merge([
            'timestamp' => now()->toIso8601String(),
        ], $additionalContext);
    }

    // ========================================
    // UPLOADS - Subida de archivos
    // ========================================

    public static function upload(string $action, array $data = []): void
    {
        Log::channel('uploads')->info($action, self::getContext(array_merge([
            'module' => 'uploads',
            'action' => $action,
        ], $data)));
    }

    public static function uploadError(string $action, string $error, array $data = []): void
    {
        $context = self::getContext(array_merge([
            'module' => 'uploads',
            'action' => $action,
            'error' => $error,
        ], $data));

        Log::channel('uploads')->error($action, $context);
        Log::channel('errors')->error($action, $context);
    }

    // ========================================
    // PUBLICATIONS - Publicaciones
    // ========================================

    public static function publication(string $action, array $data = []): void
    {
        Log::channel('publications')->info($action, self::getContext(array_merge([
            'module' => 'publications',
            'action' => $action,
        ], $data)));
    }

    public static function publicationError(string $action, string $error, array $data = []): void
    {
        $context = self::getContext(array_merge([
            'module' => 'publications',
            'action' => $action,
            'error' => $error,
        ], $data));

        Log::channel('publications')->error($action, $context);
        Log::channel('errors')->error($action, $context);
    }

    // ========================================
    // CAMPAIGNS - Campañas
    // ========================================

    public static function campaign(string $action, array $data = []): void
    {
        Log::channel('campaigns')->info($action, self::getContext(array_merge([
            'module' => 'campaigns',
            'action' => $action,
        ], $data)));
    }

    public static function campaignError(string $action, string $error, array $data = []): void
    {
        $context = self::getContext(array_merge([
            'module' => 'campaigns',
            'action' => $action,
            'error' => $error,
        ], $data));

        Log::channel('campaigns')->error($action, $context);
        Log::channel('errors')->error($action, $context);
    }

    // ========================================
    // BILLING - Facturación y pagos
    // ========================================

    public static function billing(string $action, array $data = []): void
    {
        Log::channel('billing')->info($action, self::getContext(array_merge([
            'module' => 'billing',
            'action' => $action,
        ], $data)));
    }

    public static function billingError(string $action, string $error, array $data = []): void
    {
        $context = self::getContext(array_merge([
            'module' => 'billing',
            'action' => $action,
            'error' => $error,
        ], $data));

        Log::channel('billing')->error($action, $context);
        Log::channel('errors')->error($action, $context);
    }

    // ========================================
    // API - Llamadas API externas
    // ========================================

    public static function api(string $action, array $data = []): void
    {
        Log::channel('api')->info($action, self::getContext(array_merge([
            'module' => 'api',
            'action' => $action,
        ], $data)));
    }

    public static function apiError(string $action, string $error, array $data = []): void
    {
        $context = self::getContext(array_merge([
            'module' => 'api',
            'action' => $action,
            'error' => $error,
        ], $data));

        Log::channel('api')->error($action, $context);
        Log::channel('errors')->error($action, $context);
    }

    // ========================================
    // JOBS - Trabajos en segundo plano
    // ========================================

    public static function job(string $action, array $data = []): void
    {
        Log::channel('jobs')->info($action, self::getContext(array_merge([
            'module' => 'jobs',
            'action' => $action,
        ], $data)));
    }

    public static function jobError(string $action, string $error, array $data = []): void
    {
        $context = self::getContext(array_merge([
            'module' => 'jobs',
            'action' => $action,
            'error' => $error,
        ], $data));

        Log::channel('jobs')->error($action, $context);
        Log::channel('errors')->error($action, $context);
    }

    // ========================================
    // AUTH - Autenticación
    // ========================================

    public static function auth(string $action, array $data = []): void
    {
        Log::channel('auth')->info($action, self::getContext(array_merge([
            'module' => 'auth',
            'action' => $action,
        ], $data)));
    }

    public static function authError(string $action, string $error, array $data = []): void
    {
        $context = self::getContext(array_merge([
            'module' => 'auth',
            'action' => $action,
            'error' => $error,
        ], $data));

        Log::channel('auth')->error($action, $context);
        Log::channel('errors')->error($action, $context);
    }

    // ========================================
    // SOCIAL - Redes sociales
    // ========================================

    public static function social(string $action, array $data = []): void
    {
        Log::channel('social')->info($action, self::getContext(array_merge([
            'module' => 'social',
            'action' => $action,
        ], $data)));
    }

    public static function socialError(string $action, string $error, array $data = []): void
    {
        $context = self::getContext(array_merge([
            'module' => 'social',
            'action' => $action,
            'error' => $error,
        ], $data));

        Log::channel('social')->error($action, $context);
        Log::channel('errors')->error($action, $context);
    }

    // ========================================
    // PERFORMANCE - Métricas de rendimiento
    // ========================================

    public static function performance(string $action, array $data = []): void
    {
        Log::channel('performance')->info($action, self::getContext(array_merge([
            'module' => 'performance',
            'action' => $action,
        ], $data)));
    }

    // ========================================
    // SECURITY - Eventos de seguridad
    // ========================================

    public static function security(string $action, array $data = []): void
    {
        Log::channel('security')->warning($action, self::getContext(array_merge([
            'module' => 'security',
            'action' => $action,
        ], $data)));
    }

    // ========================================
    // ERRORS - Errores generales
    // ========================================

    public static function error(string $message, array $context = []): void
    {
        Log::channel('errors')->error($message, self::getContext($context));
    }

    // ========================================
    // BÚSQUEDA Y ANÁLISIS
    // ========================================

    /**
     * Buscar logs por trace_id (seguimiento completo de un request)
     */
    public static function searchByTraceId(string $traceId, string $logFile = 'laravel'): array
    {
        return self::searchInLog("\"trace_id\":\"$traceId\"", $logFile);
    }

    /**
     * Buscar logs por usuario
     */
    public static function searchByUser(int $userId, string $logFile = 'laravel'): array
    {
        return self::searchInLog("\"user_id\":$userId", $logFile);
    }

    /**
     * Buscar logs por workspace
     */
    public static function searchByWorkspace(int $workspaceId, string $logFile = 'laravel'): array
    {
        return self::searchInLog("\"workspace_id\":$workspaceId", $logFile);
    }

    /**
     * Buscar logs por acción
     */
    public static function searchByAction(string $action, string $logFile = 'laravel'): array
    {
        return self::searchInLog("\"action\":\"$action\"", $logFile);
    }

    /**
     * Buscar en archivo de log
     */
    private static function searchInLog(string $pattern, string $logFile): array
    {
        $logPath = storage_path("logs/{$logFile}.log");
        
        if (!file_exists($logPath)) {
            return [];
        }

        $lines = file($logPath);
        $results = [];

        foreach ($lines as $line) {
            if (str_contains($line, $pattern)) {
                $results[] = json_decode($line, true) ?? $line;
            }
        }

        return $results;
    }

    /**
     * Obtener estadísticas de logs
     */
    public static function getStats(string $logFile = 'laravel'): array
    {
        $logPath = storage_path("logs/{$logFile}.log");
        
        if (!file_exists($logPath)) {
            return [];
        }

        $lines = file($logPath);
        $stats = [
            'total' => count($lines),
            'by_level' => [],
            'by_module' => [],
            'by_action' => [],
        ];

        foreach ($lines as $line) {
            $data = json_decode($line, true);
            if (!$data) continue;

            // Por nivel
            $level = $data['level'] ?? 'unknown';
            $stats['by_level'][$level] = ($stats['by_level'][$level] ?? 0) + 1;

            // Por módulo
            if (isset($data['module'])) {
                $module = $data['module'];
                $stats['by_module'][$module] = ($stats['by_module'][$module] ?? 0) + 1;
            }

            // Por acción
            if (isset($data['action'])) {
                $action = $data['action'];
                $stats['by_action'][$action] = ($stats['by_action'][$action] ?? 0) + 1;
            }
        }

        return $stats;
    }
}

