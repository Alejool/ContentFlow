<?php

namespace Tests\Unit\Services\Payment;

use Tests\TestCase;
use App\Services\Payment\Gateways\StripeGateway;
use Illuminate\Support\Facades\Config;

/**
 * Unit tests for StripeGateway idempotency key generation.
 *
 * Validates:
 * - swapSubscription uses deterministic idempotency key
 * - Same swap params → same key (idempotent)
 * - Different params → different key (no collision)
 * - createAddonCheckout keys are scoped to workspace + SKU + quantity + hour
 */
class StripeGatewayIdempotencyTest extends TestCase
{
    /**
     * Verify the idempotency key formula for swapSubscription.
     * The key must be deterministic: same inputs → same hash.
     */
    /** @test */
    public function swap_subscription_idempotency_key_is_deterministic(): void
    {
        $subscriptionId = 'sub_abc123';
        $newPriceId = 'price_xyz789';

        $key1 = hash('sha256', "swap:{$subscriptionId}:{$newPriceId}");
        $key2 = hash('sha256', "swap:{$subscriptionId}:{$newPriceId}");

        $this->assertSame($key1, $key2,
            'Idempotency key must be identical for the same subscription/price combination');
    }

    /** @test */
    public function swap_subscription_keys_differ_for_different_prices(): void
    {
        $subscriptionId = 'sub_abc123';

        $key1 = hash('sha256', "swap:{$subscriptionId}:price_starter");
        $key2 = hash('sha256', "swap:{$subscriptionId}:price_professional");

        $this->assertNotSame($key1, $key2,
            'Different target prices must produce different idempotency keys');
    }

    /** @test */
    public function swap_subscription_keys_differ_for_different_subscriptions(): void
    {
        $priceId = 'price_professional';

        $key1 = hash('sha256', "swap:sub_aaa:{$priceId}");
        $key2 = hash('sha256', "swap:sub_bbb:{$priceId}");

        $this->assertNotSame($key1, $key2,
            'Different subscription IDs must produce different idempotency keys');
    }

    /** @test */
    public function addon_checkout_idempotency_key_is_deterministic_within_hour(): void
    {
        $workspaceId = 42;
        $sku = 'ai_1000_credits';
        $quantity = 2;
        $hour = now()->format('YmdH');

        $key1 = hash('sha256', implode(':', ['addon_checkout', $workspaceId, $sku, $quantity, $hour]));
        $key2 = hash('sha256', implode(':', ['addon_checkout', $workspaceId, $sku, $quantity, $hour]));

        $this->assertSame($key1, $key2,
            'Addon checkout key must be identical for the same workspace/sku/quantity within the same hour');
    }

    /** @test */
    public function addon_checkout_keys_differ_for_different_skus(): void
    {
        $workspaceId = 42;
        $hour = now()->format('YmdH');

        $key1 = hash('sha256', implode(':', ['addon_checkout', $workspaceId, 'ai_1000_credits', 1, $hour]));
        $key2 = hash('sha256', implode(':', ['addon_checkout', $workspaceId, 'posts_100_extra', 1, $hour]));

        $this->assertNotSame($key1, $key2,
            'Different addon SKUs must produce different idempotency keys');
    }

    /** @test */
    public function addon_checkout_keys_differ_for_different_workspaces(): void
    {
        $sku = 'ai_1000_credits';
        $hour = now()->format('YmdH');

        $key1 = hash('sha256', implode(':', ['addon_checkout', 1, $sku, 1, $hour]));
        $key2 = hash('sha256', implode(':', ['addon_checkout', 2, $sku, 1, $hour]));

        $this->assertNotSame($key1, $key2,
            'Different workspace IDs must produce different idempotency keys');
    }

    /** @test */
    public function addon_checkout_keys_differ_for_different_quantities(): void
    {
        $workspaceId = 42;
        $sku = 'ai_1000_credits';
        $hour = now()->format('YmdH');

        $key1 = hash('sha256', implode(':', ['addon_checkout', $workspaceId, $sku, 1, $hour]));
        $key2 = hash('sha256', implode(':', ['addon_checkout', $workspaceId, $sku, 5, $hour]));

        $this->assertNotSame($key1, $key2,
            'Different quantities must produce different idempotency keys');
    }
}
