<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Webhooks\StripeAddonWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

class AddonWebhookSimulator extends Controller
{
    /**
     * Simular webhook para una sesión específica
     * Esto se llama automáticamente después de crear el checkout
     */
    public function simulateWebhook(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'force' => 'nullable|boolean', // Para testing
        ]);

        $sessionId = $request->session_id;
        $force = $request->boolean('force', false);

        try {
            Log::info('Simulating webhook for session', ['session_id' => $sessionId, 'force' => $force]);

            // Obtener la sesión de Stripe
            $stripe = new StripeClient(config('services.stripe.secret'));
            $session = $stripe->checkout->sessions->retrieve($sessionId);

            // Verificar si el pago fue exitoso (o forzar para testing)
            if ($session->payment_status !== 'paid' && !$force) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment not completed yet',
                    'payment_status' => $session->payment_status,
                ]);
            }

            // Para testing, simular que el pago está completo
            if ($force && $session->payment_status !== 'paid') {
                Log::info('Forcing webhook processing for testing', ['session_id' => $sessionId]);
                // Crear una copia modificada de la sesión para simular pago completo
                $sessionData = $session->toArray();
                $sessionData['payment_status'] = 'paid';
                $sessionData['status'] = 'complete';
                
                // Simular el evento de webhook con datos modificados
                $event = [
                    'type' => 'checkout.session.completed',
                    'data' => [
                        'object' => $sessionData
                    ]
                ];
            } else {
                // Simular el evento de webhook normal
                $event = [
                    'type' => 'checkout.session.completed',
                    'data' => [
                        'object' => $session->toArray()
                    ]
                ];
            }

            // Procesar el evento usando el webhook controller
            $webhookController = new StripeAddonWebhookController(
                app(\App\Services\AddonUsageService::class)
            );

            // Usar reflection para acceder al método privado
            $reflection = new \ReflectionClass($webhookController);
            $method = $reflection->getMethod('processEvent');
            $method->setAccessible(true);
            $method->invoke($webhookController, $event);

            Log::info('Webhook simulation completed successfully', ['session_id' => $sessionId]);

            return response()->json([
                'success' => true,
                'message' => 'Addon processed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Error simulating webhook', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error processing addon: ' . $e->getMessage(),
            ], 500);
        }
    }
}