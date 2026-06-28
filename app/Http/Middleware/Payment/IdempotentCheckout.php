<?php

namespace App\Http\Middleware\Payment;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Prevents duplicate checkout sessions for payment operations.
 *
 * Clients SHOULD send an `Idempotency-Key` header (UUID) per checkout attempt.
 * The first request acquires a Redis lock; any concurrent duplicate receives
 * a 409 immediately without hitting the payment gateway.
 *
 * Without a key the request is allowed through (backwards compat).
 * Lock TTL: 60 s — covers gateway round-trip + DB write.
 */
class IdempotentCheckout
{
    private const LOCK_TTL_SECONDS = 60;
    private const CACHE_PREFIX = 'idempotent_checkout:';

    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('Idempotency-Key');

        if (!$key) {
            return $next($request);
        }

        if (!preg_match('/^[a-f0-9\-]{10,64}$/i', $key)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Idempotency-Key format.',
            ], 400);
        }

        $userId = auth()->id() ?? 'guest';
        $cacheKey = self::CACHE_PREFIX . $userId . ':' . $key;

        $lock = Cache::lock($cacheKey, self::LOCK_TTL_SECONDS);

        if (!$lock->get()) {
            return response()->json([
                'success' => false,
                'message' => 'A checkout request with this key is already being processed. Please wait.',
                'code'    => 'DUPLICATE_CHECKOUT_REQUEST',
            ], 409);
        }

        try {
            return $next($request);
        } finally {
            $lock->release();
        }
    }
}
