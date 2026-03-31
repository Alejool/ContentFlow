<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class DevCacheInfoController extends Controller
{
    /**
     * Obtener información de drivers de caché/queue
     * Solo disponible en desarrollo
     */
    public function __invoke(): JsonResponse
    {
        // Solo permitir en desarrollo
        if (config('app.env') === 'production') {
            abort(404);
        }

        $redisAvailable = false;
        try {
            Redis::connection()->ping();
            $redisAvailable = true;
        } catch (\Exception $e) {
            $redisAvailable = false;
        }

        return response()->json([
            'cache_driver' => config('cache.default'),
            'queue_driver' => config('queue.default'),
            'session_driver' => config('session.driver'),
            'environment' => config('app.env'),
            'redis_available' => $redisAvailable,
        ]);
    }
}
