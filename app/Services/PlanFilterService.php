<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

class PlanFilterService
{
    /**
     * Filtrar límites de un plan según configuración del sistema
     */
    public function filterPlanLimits(array $limits): array
    {
        $filtered = $limits;

        // Si IA está deshabilitada, remover límite de IA
        if (!SystemSetting::isFeatureEnabled('ai')) {
            unset($filtered['ai_requests_per_month']);
        }

        // Si Analytics está deshabilitado, remover límite de analytics
        if (!SystemSetting::isFeatureEnabled('analytics')) {
            unset($filtered['analytics_reports']);
        }

        // Si Reels está deshabilitado, remover límite de reels
        if (!SystemSetting::isFeatureEnabled('reels')) {
            unset($filtered['reels_per_month']);
        }

        // Si Approval Workflows está deshabilitado, remover límite
        if (!SystemSetting::isFeatureEnabled('approval_workflows')) {
            unset($filtered['approval_workflows']);
        }

        // Si Calendar Sync está deshabilitado, remover límite
        if (!SystemSetting::isFeatureEnabled('calendar_sync')) {
            unset($filtered['external_calendars']);
        }

        return $filtered;
    }

    /**
     * Filtrar características de un plan según configuración del sistema
     */
    public function filterPlanFeatures(array $features): array
    {
        $filtered = $features;

        // Si IA está deshabilitada, remover características de IA
        if (!SystemSetting::isFeatureEnabled('ai')) {
            unset($filtered['ai_content_generation']);
            unset($filtered['ai_suggestions']);
            unset($filtered['ai_optimization']);
        }

        // Si Analytics está deshabilitado, remover características de analytics
        if (!SystemSetting::isFeatureEnabled('analytics')) {
            unset($filtered['analytics_type']);
            unset($filtered['advanced_analytics']);
        }

        // Si Reels está deshabilitado, remover características de reels
        if (!SystemSetting::isFeatureEnabled('reels')) {
            unset($filtered['reels_generation']);
            unset($filtered['reels_watermark']);
        }

        // Si Approval Workflows está deshabilitado, remover características
        if (!SystemSetting::isFeatureEnabled('approval_workflows')) {
            unset($filtered['approval_workflows']);
        }

        // Si Calendar Sync está deshabilitado, remover características
        if (!SystemSetting::isFeatureEnabled('calendar_sync')) {
            unset($filtered['calendar_sync']);
        }

        // Si Bulk Operations está deshabilitado, remover características
        if (!SystemSetting::isFeatureEnabled('bulk_operations')) {
            unset($filtered['bulk_operations']);
        }

        // Si White Label está deshabilitado, remover características
        if (!SystemSetting::isFeatureEnabled('white_label')) {
            unset($filtered['white_label']);
            unset($filtered['custom_branding']);
        }

        return $filtered;
    }

    /**
     * Filtrar plan completo según configuración del sistema
     */
    public function filterPlan(array $plan): array
    {
        $filtered = $plan;

        // Filtrar límites
        if (isset($filtered['limits'])) {
            $filtered['limits'] = $this->filterPlanLimits($filtered['limits']);
        }

        // Filtrar características
        if (isset($filtered['features'])) {
            $filtered['features'] = $this->filterPlanFeatures($filtered['features']);
        }

        return $filtered;
    }

    /**
     * Filtrar todos los planes según configuración del sistema
     */
    public function filterPlans(array $plans): array
    {
        return array_map(function ($plan) {
            return $this->filterPlan($plan);
        }, $plans);
    }

    /**
     * Obtener métricas de uso visibles según configuración del sistema
     */
    public function getVisibleUsageMetrics(): array
    {
        $metrics = [
            'publications' => true, // Siempre visible
            'social_accounts' => true, // Siempre visible
            'storage' => true, // Siempre visible
        ];

        // IA solo visible si está habilitada
        $metrics['ai_requests'] = SystemSetting::isFeatureEnabled('ai');

        // Team members solo visible si el addon está habilitado
        $metrics['team_members'] = SystemSetting::isAddonEnabled('team_members');

        return $metrics;
    }

    /**
     * Verificar si un límite específico debe mostrarse
     */
    public function shouldShowLimit(string $limitKey): bool
    {
        $limitFeatureMap = [
            'ai_requests_per_month' => 'ai',
            'analytics_reports' => 'analytics',
            'reels_per_month' => 'reels',
            'approval_workflows' => 'approval_workflows',
            'external_calendars' => 'calendar_sync',
        ];

        if (isset($limitFeatureMap[$limitKey])) {
            return SystemSetting::isFeatureEnabled($limitFeatureMap[$limitKey]);
        }

        // Límites que siempre se muestran
        return true;
    }

    /**
     * Verificar si una característica específica debe mostrarse
     */
    public function shouldShowFeature(string $featureKey): bool
    {
        $featureMap = [
            'ai_content_generation' => 'ai',
            'ai_suggestions' => 'ai',
            'ai_optimization' => 'ai',
            'analytics_type' => 'analytics',
            'advanced_analytics' => 'analytics',
            'reels_generation' => 'reels',
            'reels_watermark' => 'reels',
            'approval_workflows' => 'approval_workflows',
            'calendar_sync' => 'calendar_sync',
            'bulk_operations' => 'bulk_operations',
            'white_label' => 'white_label',
            'custom_branding' => 'white_label',
        ];

        if (isset($featureMap[$featureKey])) {
            return SystemSetting::isFeatureEnabled($featureMap[$featureKey]);
        }

        // Características que siempre se muestran
        return true;
    }
}
