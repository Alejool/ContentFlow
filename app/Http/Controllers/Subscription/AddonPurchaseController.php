<?php

namespace App\Http\Controllers\Subscription;

use App\Helpers\AddonHelper;
use App\Http\Controllers\Controller;
use App\Models\WorkspaceAddon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AddonPurchaseController extends Controller
{
    /**
     * Mostrar página de éxito después de comprar un addon
     */
    public function success(Request $request)
    {
        $sessionId = $request->get('session_id');
        $gateway = $request->get('gateway', 'stripe');
        
        if (!$sessionId && $gateway === 'stripe') {
            return redirect()->route('subscription.addons')
                ->with('error', 'Sesión de pago no encontrada');
        }

        Log::info('Showing addon purchase success page', [
            'session_id' => $sessionId,
            'gateway' => $gateway,
            'user_id' => auth()->id(),
        ]);

        // Buscar el addon comprado
        $workspace = auth()->user()->currentWorkspace;
        
        if (!$workspace) {
            return redirect()->route('subscription.addons')
                ->with('error', 'Workspace no encontrado');
        }

        $addon = null;

        // Buscar addon según el gateway
        if ($gateway === 'stripe' && $sessionId) {
            // Buscar por stripe session_id
            $addon = WorkspaceAddon::where('workspace_id', $workspace->id)
                ->where('stripe_session_id', $sessionId)
                ->orderBy('purchased_at', 'desc')
                ->first();
                
            // Si no encontramos por session_id, buscar por payment_intent
            if (!$addon) {
                $addon = WorkspaceAddon::where('workspace_id', $workspace->id)
                    ->where('stripe_payment_intent_id', 'like', '%' . substr($sessionId, -10))
                    ->orderBy('purchased_at', 'desc')
                    ->first();
            }

            // Si aún no encontramos el addon, intentar procesar el webhook
            if (!$addon && $sessionId) {
                Log::info('Addon not found, attempting to process webhook', [
                    'session_id' => $sessionId,
                    'workspace_id' => $workspace->id,
                ]);

                try {
                    // Llamar al simulador de webhook
                    $webhookController = new \App\Http\Controllers\Api\AddonWebhookSimulator();
                    $webhookRequest = new \Illuminate\Http\Request();
                    $webhookRequest->merge([
                        'session_id' => $sessionId,
                        'force' => true, // Forzar procesamiento para casos donde el pago no está marcado como completo
                    ]);
                    
                    $webhookResponse = $webhookController->simulateWebhook($webhookRequest);
                    $webhookData = json_decode($webhookResponse->getContent(), true);
                    
                    if ($webhookData['success'] ?? false) {
                        Log::info('Webhook processed successfully, searching for addon again', [
                            'session_id' => $sessionId,
                        ]);
                        
                        // Buscar el addon nuevamente después de procesar el webhook
                        $addon = WorkspaceAddon::where('workspace_id', $workspace->id)
                            ->where('stripe_session_id', $sessionId)
                            ->orderBy('purchased_at', 'desc')
                            ->first();
                    } else {
                        Log::warning('Webhook processing failed', [
                            'session_id' => $sessionId,
                            'response' => $webhookData,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Error processing webhook in success page', [
                        'session_id' => $sessionId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } else {
            // Para otros gateways, buscar el más reciente
            $addon = WorkspaceAddon::where('workspace_id', $workspace->id)
                ->where('is_active', true)
                ->orderBy('purchased_at', 'desc')
                ->first();
        }

        // Si no encontramos el addon, mostrar el más reciente o redirigir con mensaje
        if (!$addon) {
            Log::warning('No addon found for success page after webhook processing', [
                'session_id' => $sessionId,
                'gateway' => $gateway,
                'workspace_id' => $workspace->id,
            ]);
            
            return redirect()->route('subscription.addons')
                ->with('success', 'Compra procesada exitosamente. Tu addon se activará en unos momentos.');
        }

        // Obtener configuración del addon
        $addonConfig = AddonHelper::findBySku($addon->addon_sku);
        
        $purchaseData = [
            'addon_sku' => $addon->addon_sku,
            'addon_name' => $addonConfig['name'] ?? $addon->addon_sku,
            'addon_type' => $addon->addon_type,
            'amount' => $addon->total_amount,
            'price' => $addon->price_paid,
            'session_id' => $sessionId ?? 'N/A',
            'gateway' => $gateway,
            'purchase_date' => $addon->purchased_at->toISOString(),
        ];

        return Inertia::render('Subscription/AddonPurchaseSuccess', [
            'purchase' => $purchaseData,
        ]);
    }

    /**
     * Mostrar página de cancelación
     */
    public function cancelled(Request $request)
    {
        Log::info('Addon purchase cancelled', [
            'session_id' => $request->get('session_id'),
            'user_id' => auth()->id(),
        ]);

        return redirect()->route('subscription.addons')
            ->with('error', 'Compra cancelada. No se realizó ningún cargo.');
    }
}