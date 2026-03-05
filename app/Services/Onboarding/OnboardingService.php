<?php

namespace App\Services\Onboarding;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Role\Role;
use App\Models\Subscription\Subscription;
use App\Models\Subscription\UsageMetric;

class OnboardingService
{
    public function completeInitialSetup(User $user, array $data): Workspace
    {
        // Crear workspace inicial
        $workspace = Workspace::create([
            'name' => $data['workspace_name'] ?? "{$user->name}'s Workspace",
            'created_by' => $user->id,
        ]);

        // Asignar usuario como owner
        $ownerRole = Role::where('slug', 'owner')->first();
        
        if ($ownerRole) {
            $workspace->users()->attach($user->id, [
                'role_id' => $ownerRole->id,
            ]);
        }

        // Crear suscripción trial o free
        $plan = $data['plan'] ?? 'professional';
        $isTrial = $plan !== 'free';

        $subscription = $workspace->subscription()->create([
            'plan' => $plan,
            'status' => $isTrial ? 'trialing' : 'active',
            'trial_ends_at' => $isTrial ? now()->addDays(14) : null,
        ]);

        // Inicializar métricas
        $this->initializeMetrics($workspace, $subscription);

        // Marcar onboarding como completado
        if ($user->onboardingState) {
            $user->onboardingState->update([
                'workspace_created' => true,
                'trial_started' => $isTrial,
            ]);
        }

        return $workspace;
    }

    private function initializeMetrics(Workspace $workspace, Subscription $subscription): void
    {
        $limits = config("plans.{$subscription->plan}.limits", []);
        
        $metrics = [
            'publications' => $limits['publications_per_month'] ?? 0,
            'storage' => $limits['storage_gb'] ?? 0,
            'ai_requests' => $limits['ai_requests_per_month'] ?? 0,
        ];

        foreach ($metrics as $metricType => $limit) {
            UsageMetric::create([
                'workspace_id' => $workspace->id,
                'metric_type' => $metricType,
                'current_usage' => 0,
                'limit' => $limit,
                'period_start' => now()->startOfMonth(),
                'period_end' => now()->endOfMonth(),
            ]);
        }
    }

    public function startTrial(Workspace $workspace, string $plan = 'professional', int $days = 14): void
    {
        $subscription = $workspace->subscription;

        if ($subscription) {
            $subscription->update([
                'plan' => $plan,
                'status' => 'trialing',
                'trial_ends_at' => now()->addDays($days),
            ]);
        } else {
            $subscription = $workspace->subscription()->create([
                'plan' => $plan,
                'status' => 'trialing',
                'trial_ends_at' => now()->addDays($days),
            ]);
        }

        // Actualizar límites
        $this->updateMetricsLimits($workspace, $subscription);
    }

    private function updateMetricsLimits(Workspace $workspace, Subscription $subscription): void
    {
        $limits = config("plans.{$subscription->plan}.limits", []);

        $metrics = [
            'publications' => $limits['publications_per_month'] ?? 0,
            'storage' => $limits['storage_gb'] ?? 0,
            'ai_requests' => $limits['ai_requests_per_month'] ?? 0,
        ];

        foreach ($metrics as $metricType => $limit) {
            UsageMetric::updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'metric_type' => $metricType,
                    'period_start' => now()->startOfMonth(),
                    'period_end' => now()->endOfMonth(),
                ],
                [
                    'limit' => $limit,
                ]
            );
        }
    }
}
