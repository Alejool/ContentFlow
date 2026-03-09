<?php

namespace App\Console\Commands;

use App\Models\Workspace\Workspace;
use App\Models\WorkspaceAddon;
use App\Helpers\AddonHelper;
use Illuminate\Console\Command;

class TestAddonPurchase extends Command
{
    protected $signature = 'test:addon-purchase {workspace_id} {sku}';
    protected $description = 'Simular una compra de addon para testing';

    public function handle()
    {
        $workspaceId = $this->argument('workspace_id');
        $sku = $this->argument('sku');

        $workspace = Workspace::find($workspaceId);

        if (!$workspace) {
            $this->error("Workspace {$workspaceId} not found");
            return 1;
        }

        $addonConfig = AddonHelper::findBySku($sku);

        if (!$addonConfig) {
            $this->error("Addon {$sku} not found");
            return 1;
        }

        // Determinar tipo de addon
        $addonType = 'unknown';
        if (str_starts_with($sku, 'ai_')) {
            $addonType = 'ai_credits';
        } elseif (str_starts_with($sku, 'storage_')) {
            $addonType = 'storage';
        } elseif (str_starts_with($sku, 'posts_')) {
            $addonType = 'publications';
        } elseif (str_starts_with($sku, 'members_')) {
            $addonType = 'team_members';
        }

        $expiresAt = null;
        if (isset($addonConfig['expires_days']) && $addonConfig['expires_days'] > 0) {
            $expiresAt = now()->addDays($addonConfig['expires_days']);
        }

        $addon = WorkspaceAddon::create([
            'workspace_id' => $workspaceId,
            'addon_sku' => $sku,
            'addon_type' => $addonType,
            'quantity' => 1,
            'total_amount' => $addonConfig['amount'],
            'used_amount' => 0,
            'price_paid' => $addonConfig['price'],
            'currency' => 'usd',
            'stripe_session_id' => 'test_' . uniqid(),
            'stripe_customer_id' => 'test_cus_' . uniqid(),
            'purchased_at' => now(),
            'expires_at' => $expiresAt,
            'is_active' => true,
        ]);

        $this->info("Addon purchased successfully!");
        $this->table(
            ['Field', 'Value'],
            [
                ['ID', $addon->id],
                ['Workspace', $workspace->name],
                ['SKU', $addon->addon_sku],
                ['Type', $addon->addon_type],
                ['Amount', $addon->total_amount],
                ['Price', '$' . $addon->price_paid],
                ['Expires', $addon->expires_at ? $addon->expires_at->format('Y-m-d H:i:s') : 'Never'],
            ]
        );

        return 0;
    }
}
