<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\Checkout\Session;

class StripeCheckoutController extends Controller
{
    public function __construct()
    {
        // Configurar la clave secreta de Stripe
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Crear una sesión de checkout para un pago único
     */
    public function createCheckoutSession(Request $request)
    {
        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => 'Plan Premium - Intellipost',
                            'description' => 'Acceso completo a todas las funcionalidades',
                        ],
                        'unit_amount' => 2999, // $29.99 en centavos
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => config('app.url') . '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => config('app.url') . '/checkout/cancel',
            ]);

            return response()->json([
                'id' => $session->id,
                'url' => $session->url
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Página de éxito después del pago
     */
    public function success(Request $request)
    {
        $sessionId = $request->query('session_id');
        
        if ($sessionId) {
            try {
                $session = Session::retrieve($sessionId);
                
                return view('checkout.success', [
                    'session' => $session
                ]);
            } catch (\Exception $e) {
                return redirect('/')->with('error', 'Sesión no encontrada');
            }
        }
        
        return redirect('/');
    }

    /**
     * Página de cancelación
     */
    public function cancel()
    {
        return view('checkout.cancel');
    }
}
