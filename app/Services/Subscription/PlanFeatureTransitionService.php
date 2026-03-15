<?php

namespace App\Services\Subscription;

use App\Models\Workspace\Workspace;
use App\Models\ApprovalWorkflow;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Servicio para manejar la transición de características cuando se cambia de plan.
 * 
 * Este servicio se encarga de:
 * - Desactivar características que ya no están disponibles en el nuevo plan
 * - Ajustar configuraciones que exceden los límites del nuevo plan
 * - Registrar los cambios realizados para auditoría
 */
class PlanFeatureTransitionService
{
    /**
     * Maneja la transición de características cuando se cambia de plan.
     */
    public function handlePlanTransition(
        Workspace $workspace,
        string $oldPlan,
        string $newPlan
    ): array {
        $changes = [];

        DB::transaction(function () use ($workspace, $oldPlan, $newPlan, &$changes) {
            // 1. Manejar workflows de aprobación
            $approvalChanges = $this->handleApprovalWorkflowTransition($workspace, $oldPlan, $newPlan);
            if (!empty($approvalChanges)) {
                $changes['approval_workflows'] = $approvalChanges;
            }

            // 2. Aquí se pueden agregar más transiciones de características
            // Por ejemplo: integraciones, addons, etc.

            Log::info('Plan feature transition completed', [
                'workspace_id' => $workspace->id,
                'old_plan' => $oldPlan,
                'new_plan' => $newPlan,
                'changes' => $changes,
            ]);
        });

        return $changes;
    }

    /**
     * Maneja la transición de workflows de aprobación.
     */
    private function handleApprovalWorkflowTransition(
        Workspace $workspace,
        string $oldPlan,
        string $newPlan
    ): array {
        $oldFeatures = config("plans.{$oldPlan}.features", []);
        $newFeatures = config("plans.{$newPlan}.features", []);

        $oldApprovalFeature = $oldFeatures['approval_workflows'] ?? false;
        $newApprovalFeature = $newFeatures['approval_workflows'] ?? false;

        $changes = [];

        // Caso 1: El nuevo plan NO tiene aprobaciones (false)
        if ($newApprovalFeature === false && $oldApprovalFeature !== false) {
            $changes['action'] = 'disabled_all';
            $changes['reason'] = 'Plan does not support approval workflows';
            
            // Desactivar todos los workflows
            $disabledCount = ApprovalWorkflow::where('workspace_id', $workspace->id)
                ->where('is_enabled', true)
                ->update([
                    'is_enabled' => false,
                    'is_active' => false,
                ]);

            $changes['workflows_disabled'] = $disabledCount;

            Log::warning('Approval workflows disabled due to plan downgrade', [
                'workspace_id' => $workspace->id,
                'old_plan' => $oldPlan,
                'new_plan' => $newPlan,
                'workflows_disabled' => $disabledCount,
            ]);
        }
        // Caso 2: Cambio de 'advanced' (multinivel) a 'basic' (un solo nivel)
        elseif ($oldApprovalFeature === 'advanced' && $newApprovalFeature === 'basic') {
            $changes['action'] = 'downgraded_to_basic';
            $changes['reason'] = 'Plan only supports single-level approval workflows';

            // Encontrar workflows multinivel
            $multiLevelWorkflows = ApprovalWorkflow::where('workspace_id', $workspace->id)
                ->where('is_multi_level', true)
                ->get();

            foreach ($multiLevelWorkflows as $workflow) {
                // Guardar que era multinivel y convertir a simple
                // IMPORTANTE: NO desactivar el workflow, solo convertirlo a simple nivel
                $workflow->update([
                    'was_multi_level' => true,  // Guardar estado anterior para restaurar después
                    'is_multi_level' => false,  // Convertir a simple nivel
                    // NO cambiar is_enabled ni is_active - mantener el workflow activo
                ]);

                // Mantener solo el primer nivel
                $levels = $workflow->levels()->ordered()->get();
                if ($levels->count() > 1) {
                    // Eliminar niveles adicionales (mantener solo el primero)
                    $workflow->levels()
                        ->where('level_number', '>', 1)
                        ->delete();
                }

                $changes['workflows_converted'][] = [
                    'id' => $workflow->id,
                    'name' => $workflow->name,
                    'levels_removed' => $levels->count() - 1,
                    'kept_active' => $workflow->is_enabled,
                ];
            }

            Log::warning('Multi-level approval workflows converted to single-level', [
                'workspace_id' => $workspace->id,
                'old_plan' => $oldPlan,
                'new_plan' => $newPlan,
                'workflows_affected' => $multiLevelWorkflows->count(),
            ]);
        }
        // Caso 3: Cambio de 'basic' a 'advanced' (restaurar multinivel si lo tenía)
        elseif ($oldApprovalFeature === 'basic' && $newApprovalFeature === 'advanced') {
            $changes['action'] = 'upgraded_to_advanced';
            $changes['reason'] = 'Plan now supports multi-level approval workflows';

            // Encontrar workflows que eran multinivel antes
            $workflows = ApprovalWorkflow::where('workspace_id', $workspace->id)
                ->where('was_multi_level', true)
                ->get();

            foreach ($workflows as $workflow) {
                // Restaurar multinivel si lo tenía antes
                $workflow->update([
                    'is_multi_level' => true,  // Restaurar multinivel
                    // Mantener is_enabled y is_active como están
                ]);

                $changes['workflows_restored'][] = [
                    'id' => $workflow->id,
                    'name' => $workflow->name,
                    'is_enabled' => $workflow->is_enabled,
                ];
            }

            Log::info('Multi-level approval workflows restored', [
                'workspace_id' => $workspace->id,
                'old_plan' => $oldPlan,
                'new_plan' => $newPlan,
                'workflows_restored' => $workflows->count(),
            ]);
        }

        return $changes;
    }

    /**
     * Verifica si un workspace puede usar una característica específica.
     */
    public function canUseFeature(Workspace $workspace, string $feature): bool
    {
        $plan = $workspace->getPlanName();
        $features = config("plans.{$plan}.features", []);

        $featureValue = $features[$feature] ?? false;

        // Si es booleano, retornar directamente
        if (is_bool($featureValue)) {
            return $featureValue;
        }

        // Si es string (como 'basic', 'advanced'), significa que tiene acceso
        return $featureValue !== false;
    }

    /**
     * Verifica si un workspace puede usar aprobaciones multinivel.
     */
    public function canUseMultiLevelApprovals(Workspace $workspace): bool
    {
        $plan = $workspace->getPlanName();
        $features = config("plans.{$plan}.features", []);

        $approvalFeature = $features['approval_workflows'] ?? false;

        return $approvalFeature === 'advanced';
    }

    /**
     * Obtiene el nivel de acceso a una característica.
     */
    public function getFeatureLevel(Workspace $workspace, string $feature): string|bool
    {
        $plan = $workspace->getPlanName();
        $features = config("plans.{$plan}.features", []);

        return $features[$feature] ?? false;
    }
}
