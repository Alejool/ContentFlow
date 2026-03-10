<?php

namespace App\Services;

use App\Models\Workspace\Workspace;
use App\Models\WorkspaceAddon;
use Illuminate\Support\Facades\DB;

class AddonUsageService
{
    /**
     * Obtener el balance total disponible de un tipo de addon
     */
    public function getAvailableBalance(Workspace $workspace, string $type): int
    {
        return WorkspaceAddon::where('workspace_id', $workspace->id)
            ->where('addon_type', $type)
            ->where('is_active', true)
            ->sum(DB::raw('total_amount - used_amount'));
    }

    /**
     * Consumir recursos de un addon usando FIFO (First In, First Out)
     * Los addons solo se consumen DESPUÉS de agotar el límite del plan base
     */
    public function consume(Workspace $workspace, string $type, int $amount = 1): bool
    {
        return DB::transaction(function () use ($workspace, $type, $amount) {
            // Primero verificar si realmente necesitamos consumir addons
            $planLimitValidator = app(\App\Services\Subscription\PlanLimitValidator::class);
            $planLimits = $planLimitValidator->getPlanLimits($workspace);
            $planLimit = $planLimitValidator->getLimit($planLimits, $type);
            $currentUsage = $planLimitValidator->getCurrentUsage($workspace, $type);
            
            // Si el plan tiene límite ilimitado (-1) o no se ha excedido, no consumir addons
            if ($planLimit === -1 || $currentUsage <= $planLimit) {
                Log::info("Addon consumption not needed - usage within plan limits", [
                    'workspace_id' => $workspace->id,
                    'type' => $type,
                    'plan_limit' => $planLimit,
                    'current_usage' => $currentUsage,
                    'requested_amount' => $amount
                ]);
                return true; // No necesitamos consumir addons
            }
            
            // Calcular cuánto exceso necesitamos cubrir con addons
            $excessNeeded = $currentUsage - $planLimit;
            $addonAmountNeeded = min($amount, $excessNeeded);
            
            if ($addonAmountNeeded <= 0) {
                return true; // No necesitamos addons
            }
            
            Log::info("Consuming addons to cover excess usage", [
                'workspace_id' => $workspace->id,
                'type' => $type,
                'excess_needed' => $excessNeeded,
                'addon_amount_needed' => $addonAmountNeeded
            ]);
            
            // Obtener addons activos del tipo especificado ordenados por fecha de compra (FIFO)
            $addons = $this->getActiveAddonsByType($workspace, $type, 'asc');

            $remaining = $addonAmountNeeded;

            foreach ($addons as $addon) {
                if ($remaining <= 0) {
                    break;
                }

                $available = $addon->getAvailable();
                
                if ($available > 0) {
                    $toConsume = min($remaining, $available);
                    $addon->incrementUsed($toConsume);
                    $remaining -= $toConsume;
                    
                    Log::info("Consumed from addon", [
                        'addon_id' => $addon->id,
                        'addon_sku' => $addon->addon_sku,
                        'consumed' => $toConsume,
                        'remaining_needed' => $remaining,
                        'addon_remaining' => $addon->getAvailable()
                    ]);
                }
            }

            // Verificar si pudimos cubrir todo el exceso
            $success = $remaining === 0;
            
            if (!$success) {
                Log::warning("Could not fully cover excess usage with addons", [
                    'workspace_id' => $workspace->id,
                    'type' => $type,
                    'remaining_uncovered' => $remaining
                ]);
            }

            return $success;
        });
    }

    /**
     * Devolver recursos consumidos (por ejemplo, al cancelar una publicación)
     */
    public function refund(Workspace $workspace, string $type, int $amount = 1): void
    {
        DB::transaction(function () use ($workspace, $type, $amount) {
            // Obtener addons activos del tipo especificado ordenados por fecha de compra (LIFO para refund)
            $addons = $this->getActiveAddonsByType($workspace, $type, 'desc');

            $remaining = $amount;

            foreach ($addons as $addon) {
                if ($remaining <= 0) {
                    break;
                }

                if ($addon->used_amount > 0) {
                    $toRefund = min($remaining, $addon->used_amount);
                    $addon->decrementUsed($toRefund);
                    $remaining -= $toRefund;
                }
            }
        });
    }

    /**
     * Verificar si hay suficiente balance disponible
     */
    public function hasAvailable(Workspace $workspace, string $type, int $amount = 1): bool
    {
        $available = $this->getAvailableBalance($workspace, $type);
        return $available >= $amount;
    }

    /**
     * Obtener addons activos por tipo
     */
    private function getActiveAddonsByType(Workspace $workspace, string $type, string $order = 'asc'): \Illuminate\Support\Collection
    {
        return WorkspaceAddon::where('workspace_id', $workspace->id)
            ->where('addon_type', $type)
            ->where('is_active', true)
            ->orderBy('purchased_at', $order)
            ->get();
    }

    /**
     * Registrar una nueva compra de addon
     */
    public function recordPurchase(
        Workspace $workspace,
        string $sku,
        string $type,
        int $amount,
        float $price,
        ?string $stripePaymentIntentId = null,
        ?\DateTime $expiresAt = null
    ): WorkspaceAddon {
        return WorkspaceAddon::create([
            'workspace_id' => $workspace->id,
            'addon_sku' => $sku,
            'addon_type' => $type,
            'quantity' => 1,
            'total_amount' => $amount,
            'used_amount' => 0,
            'price_paid' => $price,
            'purchased_at' => now(),
            'expires_at' => $expiresAt,
            'is_active' => true,
            'stripe_payment_intent_id' => $stripePaymentIntentId,
        ]);
    }

    /**
     * Resetear el uso de addons cuando se cambia de plan
     * Los addons se mantienen, pero su "uso calculado" se resetea porque
     * el nuevo plan puede cubrir más uso base
     */
    public function recalculateAddonUsageForPlanChange(Workspace $workspace): void
    {
        Log::info("Recalculating addon usage after plan change", [
            'workspace_id' => $workspace->id
        ]);
        
        // Los addons mantienen su used_amount físico, pero el cálculo
        // de "cuánto se está usando" se basa en el exceso del nuevo plan
        // Esto se maneja automáticamente en ActiveAddonsController
        
        // Opcional: Limpiar caché relacionado
        cache()->forget("workspace_addons_{$workspace->id}");
        cache()->forget("addon_usage_summary_{$workspace->id}");
    }

    /**
     * Obtener el uso efectivo de addons considerando el plan actual
     * (solo el exceso sobre el límite del plan)
     */
    public function getEffectiveAddonUsage(Workspace $workspace, string $type): array
    {
        $planLimitValidator = app(\App\Services\Subscription\PlanLimitValidator::class);
        $planLimits = $planLimitValidator->getPlanLimits($workspace);
        $planLimit = $planLimitValidator->getLimit($planLimits, $type);
        $currentUsage = $planLimitValidator->getCurrentUsage($workspace, $type);
        
        $addons = $this->getActiveAddonsByType($workspace, $type);
        $totalAddonAmount = $addons->sum('total_amount');
        
        $effectiveUsed = 0;
        $effectiveRemaining = $totalAddonAmount;
        
        // Solo calcular uso de addons si se excede el plan
        if ($planLimit !== -1 && $currentUsage > $planLimit) {
            $excessUsage = $currentUsage - $planLimit;
            
            // Para storage, convertir a GB
            if ($type === 'storage') {
                $excessUsage = round($excessUsage / (1024 * 1024 * 1024), 2);
            }
            
            $effectiveUsed = min($excessUsage, $totalAddonAmount);
            $effectiveRemaining = max(0, $totalAddonAmount - $effectiveUsed);
        }
        
        return [
            'total_amount' => $totalAddonAmount,
            'effective_used' => $effectiveUsed,
            'effective_remaining' => $effectiveRemaining,
            'plan_limit' => $planLimit,
            'current_usage' => $currentUsage,
            'excess_usage' => max(0, $currentUsage - ($planLimit === -1 ? 0 : $planLimit))
        ];
    }

    /**
     * Obtener resumen de uso por tipo (versión mejorada)
     * Considera el plan actual para calcular el uso efectivo
     */
    public function getUsageSummary(Workspace $workspace): array
    {
        $types = ['ai_credits', 'storage', 'publications', 'team_members'];
        $summary = [];

        foreach ($types as $type) {
            $effectiveUsage = $this->getEffectiveAddonUsage($workspace, $type);
            
            $summary[$type] = [
                'total' => $effectiveUsage['total_amount'],
                'used' => $effectiveUsage['effective_used'],
                'available' => $effectiveUsage['effective_remaining'],
                'percentage' => $effectiveUsage['total_amount'] > 0 
                    ? round(($effectiveUsage['effective_used'] / $effectiveUsage['total_amount']) * 100) 
                    : 0,
                'plan_limit' => $effectiveUsage['plan_limit'],
                'current_usage' => $effectiveUsage['current_usage'],
                'excess_usage' => $effectiveUsage['excess_usage']
            ];
        }

        return $summary;
    }
}