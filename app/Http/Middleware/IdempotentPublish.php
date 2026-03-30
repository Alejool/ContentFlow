<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Prevents duplicate publish requests using an idempotency key.
 *
 * The client sends an `Idempotency-Key` header (UUID) per publish attempt.
 * The first request acquires a Redis lock for that key; any concurrent
 * duplicate request receives a 409 immediately without touching the DB.
 *
 * Lock TTL: 30 seconds — enough to cover the controller + job dispatch,
 * but short enough that a genuine retry after a network failure is allowed.
 */
class IdempotentPublish
{
    private const LOCK_TTL_SECONDS = 30;
    private const CACHE_PREFIX = 'idempotent_publish:';

    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('Idempotency-Key');

        // If no key is provided, let the request through (backwards compat).
        if (!$key) {
            return $next($request);
        }

        // Sanitize: only allow UUID-like strings to prevent cache poisoning.
        if (!preg_match('/^[a-f0-9\-]{10,64}$/i', $key)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Idempotency-Key format.',
            ], 400);
        }

        $cacheKey = self::CACHE_PREFIX . auth()->id() . ':' . $key;

        // Try to acquire an atomic lock.
        $lock = Cache::lock($cacheKey, self::LOCK_TTL_SECONDS);

        if (!$lock->get()) {
            // Another request with the same key is already in flight.
            return response()->json([
                'success' => false,
                'message' => 'A publish request with this key is already being processed. Please wait.',
                'code'    => 'DUPLICATE_REQUEST',
            ], 409);
        }

        // Lock acquired — release it after the response is sent.
        // We release manually so the lock is freed as soon as the job is dispatched,
        // not held for the full queue processing time.
        try {
            return $next($request);
        } finally {
            $lock->release();
        }
    }
}
