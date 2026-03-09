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


        Log::info('Grouped addons count: ' . $groupedAddons);

        $addons = $groupedAddons->map(function ($addon) {
            // Buscar configuración del addon
            $config = AddonHelper::findBySku($addon->addon_sku);
            
            if (!$config) {
                return null;
            }

            $remaining = max(0, $addon->total_amount - $addon->total_used);
            $percentage = $addon->total_amount > 0 
                ? round(($addon->total_used / $addon->total_amount) * 100) 
                : 0;

            return [
                'sku' => $addon->addon_sku,
                'name' => $config['name'],
                'type' => $addon->addon_type,
                'amount' => $addon->total_amount,
                'used' => $addon->total_used,
                'remaining' => $remaining,
                'percentage' => $percentage,
                'total_price' => (float) $addon->total_price,
                'purchase_count' => $addon->purchase_count,
                'first_purchased_at' => \Carbon\Carbon::parse($addon->first_purchased)->toDateString(),
                'last_purchased_at' => \Carbon\Carbon::parse($addon->last_purchased)->toDateString(),
                'status' => 'active',
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
