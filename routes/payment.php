<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Payment\UnifiedPaymentController;
use App\Http\Controllers\Webhooks\MercadoPagoWebhookController;
use App\Http\Controllers\Webhooks\EpaycoWebhookController;
use App\Http\Controllers\Webhooks\PayUWebhookController;
use App\Http\Controllers\Webhooks\WompiWebhookController;

/*
|--------------------------------------------------------------------------
| Payment Routes
|--------------------------------------------------------------------------
|
| Rutas para el sistema de pagos unificado con múltiples gateways
|
*/

Route::prefix('payment')->name('payment.')->group(function () {
    
    // Rutas públicas (sin autenticación)
    Route::get('/gateways', [UnifiedPaymentController::class, 'getAvailableGateways'])
        ->name('gateways');
    
    Route::get('/pricing', [UnifiedPaymentController::class, 'getPricing'])
        ->name('pricing');

    // Rutas protegidas (requieren autenticación)
    Route::middleware(['auth:sanctum'])->group(function () {
        
        // Crear checkout para suscripción
        Route::post('/checkout/subscription', [UnifiedPaymentController::class, 'createSubscriptionCheckout'])
            ->name('checkout.subscription');
        
        // Crear checkout para addon
        Route::post('/checkout/addon', [UnifiedPaymentController::class, 'createAddonCheckout'])
            ->name('checkout.addon');
    });
});

// Webhooks (sin autenticación, verificados por signature)
Route::prefix('webhooks')->name('webhooks.')->group(function () {
    
    // Stripe addons (ya existe en routes/api.php)
    // Route::post('/stripe', [StripeWebhookController::class, 'handle'])
    //     ->name('stripe');
    
    // Mercado Pago
    Route::post('/mercadopago', [MercadoPagoWebhookController::class, 'handle'])
        ->name('mercadopago');
    
    // ePayco
    Route::post('/epayco', [EpaycoWebhookController::class, 'handle'])
        ->name('epayco');
    
    // PayU
    Route::post('/payu', [PayUWebhookController::class, 'handle'])
        ->name('payu');
    
    // Wompi (Bancolombia)
    Route::post('/wompi', [WompiWebhookController::class, 'handle'])
        ->name('wompi');
});
