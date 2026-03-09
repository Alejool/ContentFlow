<?php

namespace App\Services;

use App\Models\Workspace;
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
     * Consumir recursos de un addon
     */
    public function consume(Workspace $workspace, string $type, int $amount = 1): bool
    {
        return DB::transaction(function () use ($workspace, $type, $amount) {
            // Obtener addons activos del tipo especificado ordenados por fecha de compra (FIFO)
            $addons = $this->getActiveAddonsByType($workspace, $type);

            $remaining = $amount;

            foreach ($addons as $addon) {
                if ($remaining <= 0) {
                    break;
                }

                $available = $addon->getAvailable();
                
                if ($available > 0) {
                    $toConsume = min($remaining, $available);
                    $addon->incrementUsed($toConsume);
                    $remaining -= $toConsume;
                }
            }

            return $remaining === 0;
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
     * Obtener resumen de uso por tipo
     */
    public function getUsageSummary(Workspace $workspace): array
    {
        $types = ['ai_credits', 'storage', 'publications', 'team_members'];
        $summary = [];

        foreach ($types as $type) {
            $addons = $this->getActiveAddonsByType($workspace, $type);
            
            $totalAmount = $addons->sum('total_amount');
            $totalUsed = $addons->sum('used_amount');
            $available = $totalAmount - $totalUsed;

            $summary[$type] = [
                'total' => $totalAmount,
                'used' => $totalUsed,
                'available' => $available,
                'percentage' => $totalAmount > 0 ? round(($totalUsed / $totalAmount) * 100) : 0,
            ];
        }

        return $summary;
    }
}
