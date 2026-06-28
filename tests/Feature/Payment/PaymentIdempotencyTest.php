<?php

namespace Tests\Feature\Payment;

use Tests\TestCase;
use App\Http\Middleware\Payment\IdempotentCheckout;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

/**
 * Idempotency tests for payment checkout endpoints.
 *
 * Validates that:
 * - A duplicate request with the same Idempotency-Key returns 409.
 * - A request without a key is allowed through.
 * - An invalid key format is rejected with 400.
 * - Requests from different users with the same key do NOT collide.
 */
class PaymentIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Register a throwaway test route that uses the middleware
        Route::post('/test-idempotent-checkout', function () {
            return response()->json(['success' => true]);
        })->middleware([IdempotentCheckout::class]);
    }

    /** @test */
    public function it_allows_request_without_idempotency_key(): void
    {
        $response = $this->postJson('/test-idempotent-checkout');
        $response->assertStatus(200)->assertJson(['success' => true]);
    }

    /** @test */
    public function it_allows_first_request_with_valid_key(): void
    {
        $key = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

        $response = $this->postJson('/test-idempotent-checkout', [], [
            'Idempotency-Key' => $key,
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
    }

    /** @test */
    public function it_returns_409_for_concurrent_duplicate_key(): void
    {
        $key = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
        $userId = 'guest';
        $cacheKey = 'idempotent_checkout:' . $userId . ':' . $key;

        // Simulate a lock already held by a concurrent request
        Cache::lock($cacheKey, 60)->get();

        $response = $this->postJson('/test-idempotent-checkout', [], [
            'Idempotency-Key' => $key,
        ]);

        $response->assertStatus(409)
            ->assertJsonFragment(['code' => 'DUPLICATE_CHECKOUT_REQUEST']);
    }

    /** @test */
    public function it_rejects_invalid_idempotency_key_format(): void
    {
        $response = $this->postJson('/test-idempotent-checkout', [], [
            'Idempotency-Key' => '<script>alert(1)</script>',
        ]);

        $response->assertStatus(400);
    }

    /** @test */
    public function it_rejects_too_short_idempotency_key(): void
    {
        $response = $this->postJson('/test-idempotent-checkout', [], [
            'Idempotency-Key' => 'abc',
        ]);

        $response->assertStatus(400);
    }

    /** @test */
    public function second_request_succeeds_after_lock_released(): void
    {
        $key = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

        // First request succeeds and releases lock
        $this->postJson('/test-idempotent-checkout', [], [
            'Idempotency-Key' => $key,
        ])->assertStatus(200);

        // Second request with same key should succeed (lock released)
        $this->postJson('/test-idempotent-checkout', [], [
            'Idempotency-Key' => $key,
        ])->assertStatus(200);
    }

    /** @test */
    public function same_key_from_different_users_does_not_collide(): void
    {
        $key = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

        // Simulate user 1 holding the lock
        Cache::lock('idempotent_checkout:user1:' . $key, 60)->get();

        // User 2 with same key should NOT be blocked (different namespace)
        // We test this by ensuring the middleware namespaces per auth()->id()
        // In this case no authenticated user → 'guest' namespace
        $response = $this->postJson('/test-idempotent-checkout', [], [
            'Idempotency-Key' => $key,
        ]);

        // 'guest' namespace is different from 'user1' namespace — should pass
        $response->assertStatus(200);
    }
}
