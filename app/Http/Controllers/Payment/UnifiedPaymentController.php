<?php

namespace App\Http\Controllers\Payment;

use App\Helpers\AddonHelper;
use App\Http\Controllers\Controller;
use App\Services\Payment\PaymentGatewayFactory;
use App\Services\Payment\CountryDetectionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * Controlador unificado para pagos con múltiples gateways
 */
class UnifiedPaymentController extends Controller
{
    public function __construct(
        private CountryDetectionService $countryDetection
    ) {}

    /**
     * Obtener gateways disponibles para el usuario
     */
    public function getAvailableGateways(Request $request): JsonResponse
    {
        $user = $request->user();
        $ipAddress = $request->ip();

        // Detectar país del usuario
        $countryCode = $this->countryDetection->detectCountry($user, $ipAddress);

        // Obtener gateways disponibles para ese país
        $gateways = PaymentGatewayFactory::getGatewaysForCountry($countryCode);

        $gatewayList = [];
        foreach ($gateways as $name => $gateway) {
            $gatewayList[] = [
                'name' => $name,
                'display_name' => $this->getGatewayDisplayName($name),
                'logo' => $this->getGatewayLogo($name),
                'available' => $gateway->isAvailable(),
            ];
        }

        // Información de moneda y precios
        $currency = $this->countryDetection->getCurrencyForCountry($countryCode);
        $exchangeRate = $this->countryDetection->getExchangeRate($currency);

        return response()->json([
            'country' => $countryCode,
            'currency' => $currency,
            'exchange_rate' => $exchangeRate,
            'gateways' => $gatewayList,
            'default_gateway' => $gatewayList[0]['name'] ?? 'stripe',
        ]);
    }

    /**
     * Crear sesión de checkout para suscripción
     */
    public function createSubscriptionCheckout(Request $request): JsonResponse
    {
        $request->validate([
            'plan' => 'required|in:starter,growth,professional,enterprise',
            'gateway' => 'nullable|string|in:stripe,mercadopago,epayco,payu,wompi',
        ]);

        $user = $request->user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        if (!$workspace->isOwner($user)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Only the workspace owner can manage subscriptions',
            ], 403);
        }

        try {
            // Determinar gateway(s) a intentar
            $gatewayName = $request->gateway;
            $gatewaysToTry = [];
            
            if ($gatewayName) {
                // Si se especificó un gateway, intentar ese primero, luego los demás
                $countryCode = $this->countryDetection->detectCountry($user, $request->ip());
                $availableGateways = PaymentGatewayFactory::getGatewaysForCountry($countryCode);
                $allGateways = array_keys($availableGateways);
                
                // Poner el gateway seleccionado primero
                $gatewaysToTry = array_unique(array_merge([$gatewayName], $allGateways));
            } else {
                // Auto-detectar según país y obtener todos los disponibles
                $countryCode = $this->countryDetection->detectCountry($user, $request->ip());
                $availableGateways = PaymentGatewayFactory::getGatewaysForCountry($countryCode);
                $gatewaysToTry = array_keys($availableGateways);
            }

            // Intentar con cada gateway hasta que uno funcione
            $lastError = null;
            $attemptedGateways = [];
            
            foreach ($gatewaysToTry as $gatewayName) {
                try {
                    $gateway = PaymentGatewayFactory::make($gatewayName);
                    
                    if (!$gateway->isAvailable()) {
                        Log::info("Gateway {$gatewayName} not available, trying next", [
                            'workspace_id' => $workspace->id,
                        ]);
                        $attemptedGateways[] = $gatewayName . ' (not available)';
                        continue;
                    }

                    Log::info('Attempting to create subscription checkout with gateway', [
                        'gateway' => $gatewayName,
                        'plan' => $request->plan,
                        'workspace_id' => $workspace->id,
                        'user_id' => $user->id,
                    ]);

                    // Crear checkout
                    $checkoutData = $gateway->createSubscriptionCheckout(
                        workspace: $workspace,
                        user: $user,
                        plan: $request->plan,
                        metadata: [
                            'source' => 'web',
                            'user_agent' => $request->userAgent(),
                        ]
                    );

                    Log::info('Successfully created subscription checkout', [
                        'gateway' => $gatewayName,
                        'plan' => $request->plan,
                        'workspace_id' => $workspace->id,
                    ]);

                    return response()->json($checkoutData);
                } catch (\Exception $e) {
                    $lastError = $e;
                    $attemptedGateways[] = $gatewayName . ' (failed: ' . $e->getMessage() . ')';
                    Log::warning("Gateway {$gatewayName} failed, trying next", [
                        'gateway' => $gatewayName,
                        'plan' => $request->plan,
                        'workspace_id' => $workspace->id,
                        'error' => $e->getMessage(),
                    ]);
                    continue;
                }
            }

            // Si llegamos aquí, ningún gateway funcionó
            Log::error('All gateways failed', [
                'attempted_gateways' => $attemptedGateways,
                'plan' => $request->plan,
                'workspace_id' => $workspace->id,
            ]);
            
            throw $lastError ?? new \Exception('No payment gateway available. Attempted: ' . implode(', ', $attemptedGateways));
        } catch (\Exception $e) {
            Log::error('Failed to create subscription checkout with all gateways', [
                'plan' => $request->plan,
                'workspace_id' => $workspace->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to create checkout',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crear checkout para addon
     */
    public function createAddonCheckout(Request $request): JsonResponse
    {
        $request->validate([
            'sku' => 'required|string',
            'quantity' => 'nullable|integer|min:1|max:100',
            'gateway' => 'nullable|string|in:stripe,mercadopago,epayco,payu,wompi',
        ]);

        $user = $request->user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        // Obtener configuración del addon buscando en todas las categorías
        $addon = AddonHelper::findBySku($request->sku);

        if (!$addon || !AddonHelper::isAvailable($request->sku)) {
            return response()->json(['error' => 'Invalid or unavailable addon'], 400);
        }

        try {
            // Determinar gateway(s) a intentar
            $gatewayName = $request->gateway;
            $gatewaysToTry = [];
            
            if ($gatewayName) {
                // Si se especificó un gateway, intentar ese primero, luego los demás
                $countryCode = $this->countryDetection->detectCountry($user, $request->ip());
                $availableGateways = PaymentGatewayFactory::getGatewaysForCountry($countryCode);
                $allGateways = array_keys($availableGateways);
                
                // Poner el gateway seleccionado primero
                $gatewaysToTry = array_unique(array_merge([$gatewayName], $allGateways));
            } else {
                // Auto-detectar según país y obtener todos los disponibles
                $countryCode = $this->countryDetection->detectCountry($user, $request->ip());
                $availableGateways = PaymentGatewayFactory::getGatewaysForCountry($countryCode);
                $gatewaysToTry = array_keys($availableGateways);
            }

            // Intentar con cada gateway hasta que uno funcione
            $lastError = null;
            $attemptedGateways = [];
            
            foreach ($gatewaysToTry as $gatewayName) {
                try {
                    $gateway = PaymentGatewayFactory::make($gatewayName);
                    
                    if (!$gateway->isAvailable()) {
                        Log::info("Gateway {$gatewayName} not available, trying next", [
                            'workspace_id' => $workspace->id,
                        ]);
                        $attemptedGateways[] = $gatewayName . ' (not available)';
                        continue;
                    }

                    Log::info("Attempting to create addon checkout with gateway", [
                        'gateway' => $gatewayName,
                        'sku' => $request->sku,
                        'workspace_id' => $workspace->id,
                    ]);

                    // Crear checkout
                    $checkoutData = $gateway->createAddonCheckout(
                        workspace: $workspace,
                        user: $user,
                        addonData: $addon,
                        metadata: [
                            'source' => 'web',
                            'quantity' => $request->input('quantity', 1),
                        ]
                    );

                    Log::info("Successfully created addon checkout", [
                        'gateway' => $gatewayName,
                        'sku' => $request->sku,
                        'workspace_id' => $workspace->id,
                    ]);

                    return response()->json($checkoutData);
                } catch (\Exception $e) {
                    $lastError = $e;
                    $attemptedGateways[] = $gatewayName . ' (failed: ' . $e->getMessage() . ')';
                    Log::warning("Gateway {$gatewayName} failed, trying next", [
                        'gateway' => $gatewayName,
                        'sku' => $request->sku,
                        'workspace_id' => $workspace->id,
                        'error' => $e->getMessage(),
                    ]);
                    continue;
                }
            }

            // Si llegamos aquí, ningún gateway funcionó
            Log::error('All gateways failed', [
                'attempted_gateways' => $attemptedGateways,
                'sku' => $request->sku,
                'workspace_id' => $workspace->id,
            ]);
            
            throw $lastError ?? new \Exception('No payment gateway available. Attempted: ' . implode(', ', $attemptedGateways));
        } catch (\Exception $e) {
            Log::error('Failed to create addon checkout with all gateways', [
                'sku' => $request->sku,
                'workspace_id' => $workspace->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to create checkout',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener precios convertidos para el usuario
     */
    public function getPricing(Request $request): JsonResponse
    {
        $user = $request->user();
        $countryCode = $this->countryDetection->detectCountry($user, $request->ip());
        $currency = $this->countryDetection->getCurrencyForCountry($countryCode);

        $plans = config('plans');
        $convertedPlans = [];

        foreach ($plans as $key => $plan) {
            if (!($plan['enabled'] ?? true)) {
                continue;
            }

            $priceInfo = $this->countryDetection->convertPrice($plan['price'], $countryCode);

            $convertedPlans[$key] = array_merge($plan, [
                'price_usd' => $priceInfo['usd'],
                'price_local' => $priceInfo['local'],
                'currency' => $priceInfo['currency'],
            ]);
        }

        return response()->json([
            'country' => $countryCode,
            'currency' => $currency,
            'plans' => $convertedPlans,
        ]);
    }

    /**
     * Obtener nombre de display del gateway
     */
    private function getGatewayDisplayName(string $gateway): string
    {
        return match ($gateway) {
            'stripe' => 'Stripe',
            'mercadopago' => 'Mercado Pago',
            'epayco' => 'ePayco',
            'payu' => 'PayU',
            'wompi' => 'Wompi',
            default => ucfirst($gateway),
        };
    }

    /**
     * Obtener URL del logo del gateway
     */
    private function getGatewayLogo(string $gateway): string
    {
        return match ($gateway) {
            'stripe' => '/images/gateways/stripe.svg',
            'mercadopago' => '/images/gateways/mercadopago.svg',
            'epayco' => '/images/gateways/epayco.svg',
            'payu' => '/images/gateways/payu.svg',
            'wompi' => '/images/gateways/wompi.svg',
            default => '/images/gateways/default.svg',
        };
    }
}
