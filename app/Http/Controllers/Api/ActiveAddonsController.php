<?php

namespace App\Http\Controllers\Api;

use App\Helpers\AddonHelper;
use App\Http\Controllers\Controller;
use App\Models\WorkspaceAddon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ActiveAddonsController extends Controller
{
    /**
     * Obtener los add-ons activos del usuario actual (agrupados y sumados por SKU)
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $workspace = $user->currentWorkspace;

        Log::info('Fetching active addons for workspace: ' . $workspace?->id);

        if (!$workspace) {
            return response()->json([
                'addons' => [],
                'total_spent' => 0,
            ]);
        }

        // Actualizar estados de addons expirados
        WorkspaceAddon::where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['is_active' => false]);

        // Agrupar y sumar todos los addons activos por SKU
        $groupedAddons = WorkspaceAddon::where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->select(
                'addon_sku',
                'addon_type',
                DB::raw('SUM(total_amount) as total_amount'),
                DB::raw('SUM(used_amount) as total_used'),
                DB::raw('SUM(price_paid) as total_price'),
                DB::raw('MIN(purchased_at) as first_purchased'),
                DB::raw('MAX(purchased_at) as last_purchased'),
                DB::raw('COUNT(*) as purchase_count')
            )
            ->groupBy('addon_sku', 'addon_type')
            ->get();

        Log::info('Grouped addons count: ' . $groupedAddons->count());

        // Obtener el uso actual del workspace para calcular el uso real de addons
        $planLimitValidator = app(\App\Services\Subscription\PlanLimitValidator::class);

        $addons = $groupedAddons->map(function ($addon) use ($workspace, $planLimitValidator) {
            // Buscar configuración del addon
            $config = AddonHelper::findBySku($addon->addon_sku);
            
            if (!$config) {
                return null;
            }

            // Calcular cuánto del addon se está usando
            $totalAmount = $addon->total_amount;
            
            // NUEVA LÓGICA CORRECTA: Los addons solo se consumen DESPUÉS de agotar el plan base
            // Cada cambio de plan "resetea" el uso del plan, pero los addons mantienen su estado
            
            // Obtener límites del plan actual y uso actual
            $planLimits = $planLimitValidator->getPlanLimits($workspace);
            $planLimit = $planLimitValidator->getLimit($planLimits, $addon->addon_type);
            $currentUsage = $planLimitValidator->getCurrentUsage($workspace, $addon->addon_type);
            
            Log::info("Addon calculation for {$addon->addon_type}: Plan limit: {$planLimit}, Current usage: {$currentUsage}, Addon total: {$totalAmount}");
            
            $actualUsed = 0;
            $remaining = $totalAmount;
            
            // Los addons solo se usan cuando el uso actual EXCEDE el límite del plan
            if ($planLimit !== -1 && $currentUsage > $planLimit) {
                // Calcular cuánto se está usando de los addons (solo el exceso)
                $excessUsage = $currentUsage - $planLimit;
                
                // Para storage, convertir bytes a GB para comparar
                if ($addon->addon_type === 'storage') {
                    $excessUsageGB = round($excessUsage / (1024 * 1024 * 1024), 2);
                    $actualUsed = min($excessUsageGB, $totalAmount);
                } else {
                    $actualUsed = min($excessUsage, $totalAmount);
                }
                
                $remaining = max(0, $totalAmount - $actualUsed);
                
                Log::info("Addon being consumed - Excess usage: {$excessUsage}, Addon used: {$actualUsed}, Remaining: {$remaining}");
            } else {
                // Si no se excede el plan, los addons no se están usando
                $actualUsed = 0;
                $remaining = $totalAmount;
                
                Log::info("Addon not being consumed - Usage within plan limits. Full addon available: {$remaining}");
            }
            
            $percentage = $totalAmount > 0 
                ? round(($actualUsed / $totalAmount) * 100) 
                : 0;

            return [
                'sku' => $addon->addon_sku,
                'name' => $config['name'],
                'type' => $addon->addon_type,
                'amount' => (float) $totalAmount,
                'used' => (float) $actualUsed,
                'remaining' => (float) $remaining,
                'percentage' => (float) $percentage,
                'price' => (float) $addon->total_price, // Add individual price for compatibility
                'total_price' => (float) $addon->total_price,
                'purchase_count' => (int) $addon->purchase_count,
                'first_purchased_at' => \Carbon\Carbon::parse($addon->first_purchased)->toDateString(),
                'last_purchased_at' => \Carbon\Carbon::parse($addon->last_purchased)->toDateString(),
                'expires_at' => null, // Add expires_at field
                'status' => $remaining <= 0 ? 'depleted' : ($percentage > 90 ? 'low' : 'active'),
            ];
        })->filter()->values();

        $totalSpent = WorkspaceAddon::where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->sum('price_paid');

        Log::info('Found ' . $addons->count() . ' active addons, total spent: ' . $totalSpent);

        return response()->json([
            'addons' => $addons,
            'total_spent' => (float) $totalSpent,
        ]);
    }

    /**
     * Obtener resumen detallado de addons con información del plan
     */
    public function summary(Request $request)
    {
        $user = Auth::user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            return response()->json([
                'summary' => [],
                'plan_info' => null,
            ]);
        }

        $addonUsageService = app(\App\Services\AddonUsageService::class);
        $summary = $addonUsageService->getUsageSummary($workspace);
        
        // Obtener información del plan actual
        $planLimitValidator = app(\App\Services\Subscription\PlanLimitValidator::class);
        $planLimits = $planLimitValidator->getPlanLimits($workspace);
        
        $planInfo = [
            'current_plan' => $user->current_plan,
            'limits' => $planLimits,
            'plan_started_at' => $user->plan_started_at?->toISOString(),
        ];

        return response()->json([
            'summary' => $summary,
            'plan_info' => $planInfo,
        ]);
    }

    /**
     * Obtener el historial de compras de add-ons
     */
    public function history(Request $request)
    {
        $user = Auth::user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            return response()->json([
                'purchases' => [],
            ]);
        }

        $purchases = WorkspaceAddon::where('workspace_id', $workspace->id)
            ->orderBy('purchased_at', 'desc')
            ->get()
            ->map(function ($addon) {
                $config = AddonHelper::findBySku($addon->addon_sku);
                
                return [
                    'id' => $addon->id,
                    'sku' => $addon->addon_sku,
                    'name' => $config['name'] ?? $addon->addon_sku,
                    'type' => $addon->addon_type,
                    'amount' => $addon->total_amount,
                    'used' => $addon->used_amount,
                    'remaining' => $addon->getAvailable(),
                    'price' => (float) $addon->price_paid,
                    'purchased_at' => $addon->purchased_at->toDateString(),
                    'expires_at' => $addon->expires_at?->toDateString(),
                    'status' => $addon->is_active ? 'active' : 'inactive',
                    'stripe_payment_intent_id' => $addon->stripe_payment_intent_id,
                ];
            });

        return response()->json([
            'purchases' => $purchases,
        ]);
    }
}