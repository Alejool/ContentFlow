<?php

namespace App\Services;

use App\Models\Workspace\Workspace;
use App\Models\Subscription\WorkspaceAddon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WorkspaceAddonService
{
    /**
     * Get available addon packages with currency conversion.
     */
    public function getAvailablePackages(?string $type = null, $workspace = null, $user = null): array
    {
        $addons = config('addons');
        
        // Obtener servicio de conversión de moneda
        $currencyService = app(\App\Services\Payment\CurrencyConversionService::class);

        if ($type) {
            $packages = $addons[$type]['packages'] ?? [];
            
            // Convertir precios de todos los paquetes
            $convertedPackages = [];
            foreach ($packages as $sku => $package) {
                $convertedPackages[$sku] = $this->convertPackagePrice($package, $currencyService, $workspace, $user);
            }
            
            return $convertedPackages;
        }

        // Convertir precios de todos los tipos
        $result = [];
        foreach (['ai_credits', 'storage', 'publications', 'team_members'] as $addonType) {
            if (isset($addons[$addonType]['packages'])) {
                $packages = $addons[$addonType]['packages'];
                $convertedPackages = [];
                
                foreach ($packages as $sku => $package) {
                    $convertedPackages[$sku] = $this->convertPackagePrice($package, $currencyService, $workspace, $user);
                }
                
                $result[$addonType] = $convertedPackages;
            }
        }

        return $result;
    }

    /**
     * Convertir precio de un paquete a moneda local
     */
    private function convertPackagePrice(array $package, $currencyService, $workspace, $user): array
    {
        $priceData = $currencyService->convertPrice(
            $package['price'],
            $workspace,
            $user
        );

        return array_merge($package, [
            'price_usd' => $priceData['usd_price'],
            'price_local' => $priceData['local_price'],
            'currency' => $priceData['currency'],
            'country' => $priceData['country'],
            'exchange_rate' => $priceData['exchange_rate'],
            'formatted_price' => $priceData['formatted'],
        ]);
    }

    /**
     * Get addon package by SKU.
     */
    public function getPackageBySku(string $sku): ?array
    {
        $allPackages = $this->getAvailablePackages();

        foreach ($allPackages as $type => $packages) {
            if (isset($packages[$sku])) {
                return array_merge($packages[$sku], ['type' => $type]);
            }
        }

        return null;
    }

    /**
     * Purchase addon for workspace.
     */
    public function purchaseAddon(
        Workspace $workspace,
        string $sku,
        int $quantity = 1,
        ?string $stripePaymentIntentId = null,
        ?string $stripeInvoiceId = null
    ): WorkspaceAddon {
        $package = $this->getPackageBySku($sku);

        if (!$package) {
            throw new \InvalidArgumentException("Invalid addon SKU: {$sku}");
        }

        if (!$package['enabled']) {
            throw new \InvalidArgumentException("Addon package is not available: {$sku}");
        }

        $totalAmount = $package['amount'] * $quantity;
        $totalPrice = $package['price'] * $quantity;
        $expiresAt = $package['expires_days']
            ? now()->addDays($package['expires_days'])
            : null;

        $addon = $workspace->addons()->create([
            'addon_type' => $package['type'],
            'addon_sku' => $sku,
            'quantity' => $quantity,
            'total_amount' => $totalAmount,
            'used_amount' => 0,
            'price_paid' => $totalPrice,
            'stripe_payment_intent_id' => $stripePaymentIntentId,
            'stripe_invoice_id' => $stripeInvoiceId,
            'purchased_at' => now(),
            'expires_at' => $expiresAt,
            'is_active' => true,
        ]);

        Log::info('Addon purchased', [
            'workspace_id' => $workspace->id,
            'addon_id' => $addon->id,
            'sku' => $sku,
            'quantity' => $quantity,
            'total_amount' => $totalAmount,
            'price_paid' => $totalPrice,
        ]);

        return $addon;
    }

    /**
     * Get workspace addon balance.
     */
    public function getAddonBalance(Workspace $workspace, string $type): array
    {
        $addons = $workspace->addons()
            ->ofType($type)
            ->active()
            ->get();

        $totalAmount = $addons->sum('total_amount');
        $usedAmount = $addons->sum('used_amount');
        $remainingAmount = $totalAmount - $usedAmount;

        return [
            'type' => $type,
            'total' => $totalAmount,
            'used' => $usedAmount,
            'remaining' => $remainingAmount,
            'percentage_used' => $totalAmount > 0 ? round(($usedAmount / $totalAmount) * 100, 2) : 0,
            'addons_count' => $addons->count(),
            'addons' => $addons->map(function ($addon) {
                return [
                    'id' => $addon->id,
                    'sku' => $addon->addon_sku,
                    'total' => $addon->total_amount,
                    'used' => $addon->used_amount,
                    'remaining' => $addon->getRemainingAmount(),
                    'percentage_used' => $addon->getUsagePercentage(),
                    'purchased_at' => $addon->purchased_at,
                    'expires_at' => $addon->expires_at,
                ];
            }),
        ];
    }

    /**
     * Use addon credits/storage.
     */
    public function useAddon(Workspace $workspace, string $type, int $amount = 1): bool
    {
        // Obtener add-ons activos ordenados por fecha de expiración (FIFO)
        $addons = $workspace->addons()
            ->ofType($type)
            ->active()
            ->orderBy('expires_at', 'asc')
            ->orderBy('purchased_at', 'asc')
            ->get();

        $remainingToUse = $amount;

        foreach ($addons as $addon) {
            if ($remainingToUse <= 0) {
                break;
            }

            $available = $addon->getRemainingAmount();

            if ($available > 0) {
                $toUse = min($remainingToUse, $available);
                $addon->incrementUsage($toUse);
                $remainingToUse -= $toUse;

                Log::info('Addon usage', [
                    'workspace_id' => $workspace->id,
                    'addon_id' => $addon->id,
                    'type' => $type,
                    'amount_used' => $toUse,
                    'remaining_in_addon' => $addon->fresh()->getRemainingAmount(),
                ]);
            }
        }

        // Si no se pudo usar todo el monto, retornar false
        if ($remainingToUse > 0) {
            Log::warning('Insufficient addon balance', [
                'workspace_id' => $workspace->id,
                'type' => $type,
                'requested' => $amount,
                'remaining_after_use' => $remainingToUse,
            ]);
            return false;
        }

        // Verificar si se debe notificar por saldo bajo
        $this->checkLowBalance($workspace, $type);

        return true;
    }

    /**
     * Check if workspace has sufficient addon balance.
     */
    public function hasSufficientBalance(Workspace $workspace, string $type, int $amount = 1): bool
    {
        $balance = $this->getAddonBalance($workspace, $type);
        return $balance['remaining'] >= $amount;
    }

    /**
     * Get total available amount (plan limit + addons).
     */
    public function getTotalAvailable(Workspace $workspace, string $limitType): array
    {
        $limits = $workspace->getPlanLimits();
        $planLimit = $limits[$limitType] ?? 0;

        // Mapear limitType a addon type
        $addonTypeMap = [
            'ai_requests_per_month' => 'ai_credits',
            'storage_gb' => 'storage',
        ];

        $addonType = $addonTypeMap[$limitType] ?? null;

        if (!$addonType) {
            return [
                'plan_limit' => $planLimit,
                'addon_balance' => 0,
                'total_available' => $planLimit,
                'unlimited' => $planLimit === -1,
            ];
        }

        $addonBalance = $this->getAddonBalance($workspace, $addonType);

        return [
            'plan_limit' => $planLimit,
            'addon_balance' => $addonBalance['remaining'],
            'total_available' => $planLimit === -1 ? -1 : $planLimit + $addonBalance['remaining'],
            'unlimited' => $planLimit === -1,
            'addon_details' => $addonBalance,
        ];
    }

    /**
     * Check low balance and notify if needed.
     */
    protected function checkLowBalance(Workspace $workspace, string $type): void
    {
        $settings = config('addons.settings');

        if (!$settings['notify_low_balance']) {
            return;
        }

        $balance = $this->getAddonBalance($workspace, $type);

        if ($balance['total'] === 0) {
            return;
        }

        $threshold = $settings['low_balance_threshold'];
        $percentageRemaining = $balance['remaining'] / $balance['total'];

        if ($percentageRemaining <= $threshold && $percentageRemaining > 0) {
            // TODO: Disparar evento o notificación
            Log::info('Low addon balance detected', [
                'workspace_id' => $workspace->id,
                'type' => $type,
                'remaining' => $balance['remaining'],
                'total' => $balance['total'],
                'percentage' => $percentageRemaining * 100,
            ]);
        }
    }

    /**
     * Deactivate expired addons.
     */
    public function deactivateExpiredAddons(): int
    {
        $count = WorkspaceAddon::where('is_active', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['is_active' => false]);

        Log::info('Expired addons deactivated', ['count' => $count]);

        return $count;
    }

    /**
     * Get workspace addon summary.
     */
    public function getWorkspaceAddonSummary(Workspace $workspace): array
    {
        $limits = $workspace->getPlanLimits();
        
        // Get addon balances
        $aiCreditsAddons = $this->getAddonBalance($workspace, 'ai_credits');
        $storageAddons = $this->getAddonBalance($workspace, 'storage');
        
        // Get current usage using PlanLimitValidator
        $validator = app(\App\Services\Subscription\PlanLimitValidator::class);
        
        $aiUsed = $validator->getCurrentUsage($workspace, 'ai_requests');
        $storageUsed = $validator->getCurrentUsage($workspace, 'storage');
        $teamMembersUsed = $validator->getCurrentUsage($workspace, 'team_members');
        $publicationsUsed = $validator->getCurrentUsage($workspace, 'publications');
        
        // Calculate totals (plan limit + addons)
        $aiLimit = $limits['ai_requests_per_month'] ?? 0;
        $storageLimit = $limits['storage_gb'] ?? 0;
        $teamMembersLimit = $limits['team_members'] ?? 0;
        $publicationsLimit = $limits['publications_per_month'] ?? 0;
        
        // Convert storage limit from GB to bytes for consistency
        $storageLimitBytes = $storageLimit === -1 ? -1 : ($storageLimit * 1024 * 1024 * 1024);
        
        return [
            'ai_credits' => [
                'used' => $aiUsed,
                'limit' => $aiLimit,
                'addons' => $aiCreditsAddons['remaining'],
                'percentage' => $this->calculatePercentage($aiUsed, $aiLimit + $aiCreditsAddons['remaining']),
            ],
            'storage' => [
                'used' => round($storageUsed / (1024 * 1024 * 1024), 2), // Convert bytes to GB
                'limit' => $storageLimit,
                'addons' => $storageAddons['remaining'],
                'percentage' => $this->calculatePercentage($storageUsed, $storageLimitBytes + ($storageAddons['remaining'] * 1024 * 1024 * 1024)),
            ],
            'team_members' => [
                'used' => $teamMembersUsed,
                'limit' => $teamMembersLimit,
                'addons' => 0, // Team members addons not implemented yet
                'percentage' => $this->calculatePercentage($teamMembersUsed, $teamMembersLimit),
            ],
            'publications' => [
                'used' => $publicationsUsed,
                'limit' => $publicationsLimit,
                'addons' => 0, // Publications addons not implemented yet
                'percentage' => $this->calculatePercentage($publicationsUsed, $publicationsLimit),
            ],
            'total_spent' => $workspace->addons()->sum('price_paid'),
            'active_addons_count' => $workspace->addons()->active()->count(),
            'total_addons_count' => $workspace->addons()->count(),
        ];
    }
    
    /**
     * Calculate usage percentage.
     */
    protected function calculatePercentage(int $used, int $total): float
    {
        if ($total === -1) {
            return 0; // Unlimited
        }
        
        if ($total === 0) {
            return 100;
        }
        
        return round(($used / $total) * 100, 2);
    }

    /**
     * Refund addon (if within refund period).
     */
    public function refundAddon(WorkspaceAddon $addon): bool
    {
        $settings = config('addons.settings');

        if (!$settings['allow_refunds']) {
            throw new \Exception('Refunds are not allowed');
        }

        $refundDeadline = $addon->purchased_at->addDays($settings['refund_days']);

        if (now()->isAfter($refundDeadline)) {
            throw new \Exception('Refund period has expired');
        }

        if ($addon->used_amount > 0) {
            throw new \Exception('Cannot refund partially used addon');
        }

        $addon->deactivate();

        Log::info('Addon refunded', [
            'addon_id' => $addon->id,
            'workspace_id' => $addon->workspace_id,
            'sku' => $addon->addon_sku,
            'price_paid' => $addon->price_paid,
        ]);

        return true;
    }
}
