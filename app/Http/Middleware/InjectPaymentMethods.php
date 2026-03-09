<?php

namespace App\Http\Middleware;

use App\Services\PaymentMethodService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InjectPaymentMethods
{
    /**
     * Inyecta los métodos de pago disponibles en las respuestas de Inertia
     */
    public function handle(Request $request, Closure $next)
    {
        // Solo para usuarios autenticados
        if ($request->user()) {
            $countryCode = $request->user()->country_code ?? 'US';
            
            Inertia::share([
                'paymentMethods' => function () use ($countryCode) {
                    return [
                        'available' => PaymentMethodService::getAvailableMethods($countryCode),
                        'preferred' => PaymentMethodService::getPreferredGateway($countryCode),
                        'country' => $countryCode,
                    ];
                },
            ]);
        }

        return $next($request);
    }
}
