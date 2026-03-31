<?php

namespace App\Http\Middleware;

use App\Services\Subscription\DemoModeService;
use App\Services\Subscription\SubscriptionControlService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CheckPurchasesEnabled
{
    public function __construct(
        private readonly DemoModeService $demoModeService,
        private readonly SubscriptionControlService $subscriptionControlService,
    ) {}

    /**
     * Handle an incoming request.
     *
     * Checks whether purchases are allowed before passing the request downstream.
     * Applies fail-open: if infrastructure (Redis/DB) throws, the request is allowed
     * through and the error is logged — so legitimate payments are never blocked by
     * transient infrastructure failures.
     *
     * Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Requisito 6.3 — demo mode takes priority
            if ($this->demoModeService->isActive()) {
                return response()->json([
                    'code'    => 'DEMO_MODE_ACTIVE',
                    'message' => 'Las compras están temporalmente deshabilitadas (modo demo activo).',
                ], 503);
            }

            // Requisito 6.2 — purchases disabled by admin
            if (! $this->subscriptionControlService->arePurchasesEnabled()) {
                return response()->json([
                    'code'    => 'PURCHASES_DISABLED',
                    'message' => 'Las compras están temporalmente deshabilitadas.',
                ], 503);
            }
        } catch (\Exception $e) {
            // Requisito 6.5 — fail-open: log and allow the request through
            Log::error('CheckPurchasesEnabled middleware error', [
                'error'   => $e->getMessage(),
                'url'     => $request->fullUrl(),
                'method'  => $request->method(),
            ]);
        }

        // Requisito 6.4 — pass through unmodified
        return $next($request);
    }
}
