<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Log;

class RequestMonitoringMiddleware
{
  public function handle($request, Closure $next)
  {
    $start = microtime(true);
    $response = $next($request);

    Log::info('Request metrics', [
      'duration' => microtime(true) - $start,
      'status' => $response->getStatusCode(),
      'endpoint' => $request->path()
    ]);

    return $response;
  }
}
