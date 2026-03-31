<?php

namespace App\Http\Controllers\Api;

use App\Helpers\AddonHelper;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Stripe\StripeClient;

class AddonPurchaseController extends Controller
{
    private StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    /**
     * Crear un Payment Intent para comprar un addon
     */
    public function createPaymentIntent(Request $request)
    {
        $request->validate([
            'sku' => 'required|string',
        ]);

        $user = Auth::user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            throw ValidationException::withMessages([
                'workspace' => ['No workspace selected'],
            ]);
        }

        // Obtener configuración del addon buscando en todas las categorías
        $addon = AddonHelper::findBySku($request->sku);

        if (!$addon) {
            throw ValidationException::withMessages([
                'sku' => ['Invalid addon SKU'],
            ]);
        }

        // Verificar que el addon esté disponible
        if (!AddonHelper::isAvailable($request->sku)) {
            throw ValidationException::withMessages([
                'sku' => ['This addon is not available for purchase'],
            ]);
        }

        try {
            // Crear Payment Intent en Stripe
            $paymentIntent = $this->stripe->paymentIntents->create([
                'amount' => $addon['price'] * 100, // Convertir a centavos
                'currency' => $addon['currency'] ?? 'usd',
                'metadata' => [
                    'addon_sku' => $addon['sku'],
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'addon_name' => $addon['name'],
                    'addon_amount' => $addon['amount'],
                ],
                'description' => "Addon: {$addon['name']} - {$addon['amount']} {$addon['unit']}",
            ]);

            return response()->json([
                'client_secret' => $paymentIntent->client_secret,
                'payment_intent_id' => $paymentIntent->id,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error creating payment intent for addon', [
                'error' => $e->getMessage(),
                'sku' => $request->sku,
                'workspace_id' => $workspace->id,
            ]);

            throw ValidationException::withMessages([
                'payment' => ['Failed to create payment. Please try again.'],
            ]);
        }
    }

    /**
     * Confirmar la compra después del pago exitoso
     */
    public function confirmPurchase(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        $user = Auth::user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            throw ValidationException::withMessages([
                'workspace' => ['No workspace selected'],
            ]);
        }

        try {
            // Verificar el estado del Payment Intent
            $paymentIntent = $this->stripe->paymentIntents->retrieve($request->payment_intent_id);

            if ($paymentIntent->status !== 'succeeded') {
                throw ValidationException::withMessages([
                    'payment' => ['Payment not completed'],
                ]);
            }

            // El webhook se encargará de registrar la compra
            // Aquí solo confirmamos que el pago fue exitoso

            return response()->json([
                'success' => true,
                'message' => 'Purchase completed successfully',
            ]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            \Log::error('Error confirming addon purchase', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $request->payment_intent_id,
            ]);

            throw ValidationException::withMessages([
                'payment' => ['Failed to confirm payment. Please contact support.'],
            ]);
        }
    }
}
