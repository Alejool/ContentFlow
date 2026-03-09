<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WorkspaceAddonService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class WorkspaceAddonController extends Controller
{
    public function __construct(
        protected WorkspaceAddonService $addonService
    ) {}

    /**
     * Get available addon packages with currency conversion.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $type = $request->query('type'); // 'ai_credits' or 'storage'
            $workspace = $request->user()->currentWorkspace;
            $user = $request->user();

            $packages = $this->addonService->getAvailablePackages($type, $workspace, $user);

            return response()->json([
                'success' => true,
                'data' => $packages,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching addon packages', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener paquetes disponibles',
            ], 500);
        }
    }

    /**
     * Get workspace addon balance.
     */
    public function balance(Request $request): JsonResponse
    {
        try {
            $workspace = $request->user()->currentWorkspace;

            if (!$workspace) {
                return response()->json([
                    'success' => false,
                    'message' => 'No workspace selected',
                ], 400);
            }

            $summary = $this->addonService->getWorkspaceAddonSummary($workspace);

            return response()->json([
                'success' => true,
                'data' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching addon balance', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener balance de add-ons',
            ], 500);
        }
    }

    /**
     * Get addon balance by type.
     */
    public function balanceByType(Request $request, string $type): JsonResponse
    {
        try {
            $workspace = $request->user()->currentWorkspace;

            if (!$workspace) {
                return response()->json([
                    'success' => false,
                    'message' => 'No workspace selected',
                ], 400);
            }

            if (!in_array($type, ['ai_credits', 'storage'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid addon type',
                ], 400);
            }

            $balance = $this->addonService->getAddonBalance($workspace, $type);

            return response()->json([
                'success' => true,
                'data' => $balance,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching addon balance by type', [
                'user_id' => $request->user()->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener balance',
            ], 500);
        }
    }

    /**
     * Create checkout session for addon purchase.
     */
    public function createCheckoutSession(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'sku' => 'required|string',
                'quantity' => 'integer|min:1|max:100',
            ]);

            $workspace = $request->user()->currentWorkspace;

            if (!$workspace) {
                return response()->json([
                    'success' => false,
                    'message' => 'No workspace selected',
                ], 400);
            }

            $package = $this->addonService->getPackageBySku($validated['sku']);

            if (!$package) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paquete no encontrado',
                ], 404);
            }

            if (!$package['enabled']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paquete no disponible',
                ], 400);
            }

            $quantity = $validated['quantity'] ?? 1;

            // Crear sesión de Stripe Checkout
            $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));

            $session = $stripe->checkout->sessions->create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price' => $package['stripe_price_id'],
                    'quantity' => $quantity,
                ]],
                'mode' => 'payment',
                'success_url' => config('app.frontend_url') . '/workspace/addons/success?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => config('app.frontend_url') . '/workspace/addons',
                'client_reference_id' => $workspace->id,
                'metadata' => [
                    'workspace_id' => $workspace->id,
                    'user_id' => $request->user()->id,
                    'addon_sku' => $validated['sku'],
                    'quantity' => $quantity,
                    'addon_type' => $package['type'],
                ],
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'session_id' => $session->id,
                    'url' => $session->url,
                ],
            ]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('Stripe API error creating checkout session', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear sesión de pago',
            ], 500);
        } catch (\Exception $e) {
            Log::error('Error creating checkout session', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar la solicitud',
            ], 500);
        }
    }

    /**
     * Get addon purchase history.
     */
    public function history(Request $request): JsonResponse
    {
        try {
            $workspace = $request->user()->currentWorkspace;

            if (!$workspace) {
                return response()->json([
                    'success' => false,
                    'message' => 'No workspace selected',
                ], 400);
            }

            $addons = $workspace->addons()
                ->orderBy('purchased_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $addons,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching addon history', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener historial',
            ], 500);
        }
    }

    /**
     * Request addon refund.
     */
    public function refund(Request $request, int $addonId): JsonResponse
    {
        try {
            $workspace = $request->user()->currentWorkspace;

            if (!$workspace) {
                return response()->json([
                    'success' => false,
                    'message' => 'No workspace selected',
                ], 400);
            }

            $addon = $workspace->addons()->findOrFail($addonId);

            $this->addonService->refundAddon($addon);

            return response()->json([
                'success' => true,
                'message' => 'Reembolso procesado exitosamente',
            ]);
        } catch (\Exception $e) {
            Log::error('Error processing refund', [
                'addon_id' => $addonId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
