<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    public function check()
    {
        $lastDeployment = Cache::remember('last_deployment', 60, fn() => now()->timestamp);
        
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'deployment' => $lastDeployment,
            'services' => [
                'database' => $this->checkDatabase(),
                'redis' => $this->checkRedis(),
                'octane' => true,
            ],
            'version' => config('app.version', '1.0.0'),
        ]);
    }

    private function checkDatabase(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function checkRedis(): bool
    {
        try {
            Redis::ping();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
