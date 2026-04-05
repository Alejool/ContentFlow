<?php

namespace App\Http\Middleware;

use App\Services\PaymentMethodService;
use App\Services\Payment\CountryDetectionService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InjectPaymentMethods
{
    protected CountryDetectionService $countryDetection;

    public function __construct(CountryDetectionService $countryDetection)
    {
        $this->countryDetection = $countryDetection;
    }

    /**
     * Inyecta los métodos de pago disponibles en las respuestas de Inertia
     */
    public function handle(Request $request, Closure $next)
    {
        // Solo para usuarios autenticados
        if ($request->user()) {
            // Usar el servicio de detección que prioriza: usuario -> workspace -> IP -> default
            $countryCode = $this->countryDetection->detectCountry($request->user(), $request->ip());
            
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
