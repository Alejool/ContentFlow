<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WorkspaceAddonController;
use App\Http\Controllers\Api\ActiveAddonsController;

/**
 * ============================================================================
 * WORKSPACE ADD-ONS API ROUTES
 * ============================================================================
 * 
 * Rutas para gestionar la compra y uso de paquetes adicionales (add-ons)
 * de créditos de IA y almacenamiento.
 * 
 * Todas las rutas requieren autenticación (auth:sanctum)
 * ============================================================================
 */

Route::prefix('addons')->name('addons.')->group(function () {
    // Get available addon packages
    Route::get('/', [WorkspaceAddonController::class, 'index'])->name('index');
    
    // Get active addons with usage (grouped and summed)
    Route::get('/active', [ActiveAddonsController::class, 'index'])->name('active');
    
    // Get addon purchase history
    Route::get('/history', [ActiveAddonsController::class, 'history'])->name('history');
    
    // Get detailed addon usage summary with plan information
    Route::get('/summary', [ActiveAddonsController::class, 'summary'])->name('summary');
    
    // Get workspace addon balance summary
    Route::get('/balance', [WorkspaceAddonController::class, 'balance'])->name('balance');
    
    // Get addon balance by type (ai_credits or storage)
    Route::get('/balance/{type}', [WorkspaceAddonController::class, 'balanceByType'])->name('balance.type');
    
    // Create payment intent for addon purchase
    Route::post('/purchase/intent', [\App\Http\Controllers\Api\AddonPurchaseController::class, 'createPaymentIntent'])->name('purchase.intent');
    
    // Confirm addon purchase
    Route::post('/purchase/confirm', [\App\Http\Controllers\Api\AddonPurchaseController::class, 'confirmPurchase'])->name('purchase.confirm');
    
    // Create Stripe checkout session for addon purchase (legacy)
    Route::post('/checkout', [WorkspaceAddonController::class, 'createCheckoutSession'])->name('checkout');
    
    // Request addon refund
    Route::post('/{addon}/refund', [WorkspaceAddonController::class, 'refund'])->name('refund');
});
