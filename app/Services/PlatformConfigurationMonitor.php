<?php

namespace App\Services;

use App\Models\PlatformConfiguration;
use App\Models\PlatformConfigurationAudit;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * FASE 10: Monitoreo - Sistema de alertas y estadísticas
 * 
 * Monitorea la salud del sistema de configuración de plataformas.
 */
class PlatformConfigurationMonitor
{
    private const CACHE_KEY = 'platform_config_monitor:';

    /**
     * Obtiene estadísticas del sistema
     */
    public function getStatistics(): array
    {
        return [
            'total_platforms' => $this->getTotalPlatforms(),
            'active_platforms' => $this->getActivePlatforms(),
            'content_types_count' => $this->getTotalContentTypes(),
            'supported_formats' => $this->getSupportedFormats(),
            'total_configurations' => $this->getTotalConfigurations(),
            'recent_changes' => $this->getRecentChanges(100),
            'health_status' => $this->getHealthStatus(),
        ];
    }

    /**
     * Obtiene métricas de uso
     */
    public function getUsageMetrics(int $days = 7): array
    {
        $cacheKey = self::CACHE_KEY . "usage:{$days}";

        return Cache::remember($cacheKey, 3600, function () use ($days) {
            $since = now()->subDays($days);

            return [
                'total_validations' => $this->countValidations($since),
                'validations_by_platform' => $this->getValidationsByPlatform($since),
                'success_rate' => $this->getSuccessRate($since),
                'error_rate' => $this->getErrorRate($since),
                'most_used_platforms' => $this->getMostUsedPlatforms($since),
                'peak_usage_hour' => $this->getPeakUsageHour($since),
            ];
        });
    }

    /**
     * Detecta anomalías
     */
    public function detectAnomalies(): array
    {
        $anomalies = [];

        // Anomalía: Cambios frecuentes sin auditoría
        $frequentChanges = PlatformConfigurationAudit::where(
            'created_at',
            '>=',
            now()->subHour()
        )->count();

        if ($frequentChanges > 10) {
            $anomalies[] = [
                'type' => 'FREQUENT_CHANGES',
                'severity' => 'warning',
                'message' => "{$frequentChanges} cambios en la última hora",
            ];
        }

        // Anomalía: Configuraciones inactivas
        $inactiveCount = PlatformConfiguration::where('is_active', false)->count();
        if ($inactiveCount > 50) {
            $anomalies[] = [
                'type' => 'MANY_INACTIVE_CONFIGS',
                'severity' => 'info',
                'message' => "{$inactiveCount} configuraciones inactivas",
            ];
        }

        // Anomalía: Validaciones fallidas frecuentes
        $failedValidations = $this->countFailedValidations(now()->subHour());
        if ($failedValidations > 100) {
            $anomalies[] = [
                'type' => 'HIGH_VALIDATION_FAILURE_RATE',
                'severity' => 'error',
                'message' => "{$failedValidations} validaciones fallidas en la última hora",
            ];
        }

        return $anomalies;
    }

    /**
     * Obtiene estado de salud
     */
    public function getHealthStatus(): array
    {
        $anomalies = $this->detectAnomalies();
        $errorCount = count(array_filter($anomalies, fn($a) => $a['severity'] === 'error'));
        $warningCount = count(array_filter($anomalies, fn($a) => $a['severity'] === 'warning'));

        $status = match (true) {
            $errorCount > 0 => 'critical',
            $warningCount > 0 => 'warning',
            default => 'healthy',
        };

        return [
            'status' => $status,
            'anomalies' => $anomalies,
            'error_count' => $errorCount,
            'warning_count' => $warningCount,
        ];
    }

    /**
     * Registra evento de configuración
     */
    public function logConfigurationChange(
        string $action,
        string $platformKey,
        string $configKey,
        $oldValue,
        $newValue,
        ?string $reason = null
    ): void {
        Log::info("Platform configuration {$action}", [
            'platform' => $platformKey,
            'config_key' => $configKey,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'reason' => $reason,
        ]);

        // Limpiar caché relevante
        Cache::tags(['platform_config', $platformKey])->flush();
    }

    /**
     * Alertas por cambios críticos
     */
    public function checkCriticalChanges(): array
    {
        $alerts = [];
        $recentAudits = PlatformConfigurationAudit::where(
            'created_at',
            '>=',
            now()->subHour()
        )->get();

        foreach ($recentAudits as $audit) {
            // Alertar si se modifica capacidades críticas
            if (in_array($audit->config_key, ['max_video_duration', 'rate_limit', 'quota'])) {
                $alerts[] = [
                    'platform' => $audit->platform_key,
                    'config' => $audit->config_key,
                    'action' => $audit->action,
                    'timestamp' => $audit->created_at,
                    'user' => $audit->user?->email,
                ];
            }
        }

        return $alerts;
    }

    /**
     * Exporta reporte de configuración
     */
    public function exportConfigurationReport(string $format = 'json'): string
    {
        $stats = $this->getStatistics();
        $health = $this->getHealthStatus();
        $usage = $this->getUsageMetrics();

        $report = [
            'generated_at' => now(),
            'statistics' => $stats,
            'health' => $health,
            'usage' => $usage,
        ];

        return match ($format) {
            'json' => json_encode($report, JSON_PRETTY_PRINT),
            'csv' => $this->convertToCSV($report),
            default => json_encode($report),
        };
    }

    // Métodos privados

    private function getTotalPlatforms(): int
    {
        return count(app(PlatformConfigurationService::class)->getAllPlatforms());
    }

    private function getActivePlatforms(): int
    {
        $platforms = app(PlatformConfigurationService::class)->getAllPlatforms();
        return count(array_filter($platforms, fn($p) => $p->active));
    }

    private function getTotalContentTypes(): int
    {
        $platforms = app(PlatformConfigurationService::class)->getAllPlatforms();
        $types = [];
        foreach ($platforms as $platform) {
            $types = array_merge(
                $types,
                app(PlatformConfigurationService::class)->getContentTypesForPlatform($platform->key)
            );
        }
        return count(array_unique($types));
    }

    private function getSupportedFormats(): array
    {
        $formats = [];
        $platforms = app(PlatformConfigurationService::class)->getAllPlatforms();

        foreach ($platforms as $platform) {
            $specs = app(PlatformConfigurationService::class)->getMediaSpecsForPlatform($platform->key);
            if (isset($specs['video'])) {
                $formats = array_merge($formats, $specs['video']['formats'] ?? []);
            }
            if (isset($specs['image'])) {
                $formats = array_merge($formats, $specs['image']['formats'] ?? []);
            }
        }

        return array_unique($formats);
    }

    private function getTotalConfigurations(): int
    {
        return PlatformConfiguration::count();
    }

    private function getRecentChanges(int $limit): array
    {
        return PlatformConfigurationAudit::latest()->limit($limit)->get()->toArray();
    }

    private function countValidations(\DateTime $since): int
    {
        // Implementar conteo basado en logs o database
        return 0;
    }

    private function getValidationsByPlatform(\DateTime $since): array
    {
        return [];
    }

    private function getSuccessRate(\DateTime $since): float
    {
        return 0.95;
    }

    private function getErrorRate(\DateTime $since): float
    {
        return 0.05;
    }

    private function getMostUsedPlatforms(\DateTime $since): array
    {
        return [];
    }

    private function getPeakUsageHour(\DateTime $since): int
    {
        return 0;
    }

    private function countFailedValidations(\DateTime $since): int
    {
        return 0;
    }

    private function convertToCSV(array $data): string
    {
        // Implementar conversión a CSV
        return '';
    }
}
