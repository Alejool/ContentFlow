<?php

namespace App\Http\Controllers;

use App\Models\Subscription\WorkspaceAddon;
use App\Models\WebhookEvent;
use App\Models\Workspace\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TestIdempotencyController extends Controller
{
    public function index()
    {
        $workspaces = Workspace::with('creator')->take(10)->get();
        $recentEvents = WebhookEvent::latest()->take(10)->get();
        $recentAddons = WorkspaceAddon::with('workspace')->latest()->take(10)->get();

        return view('test-idempotency', compact('workspaces', 'recentEvents', 'recentAddons'));
    }

    public function testWebhook(Request $request)
    {
        $gateway = $request->input('gateway');
        $workspaceId = $request->input('workspace_id');
        $times = (int) $request->input('times', 3);

        $workspace = Workspace::find($workspaceId);
        if (!$workspace) {
            return response()->json(['error' => 'Workspace not found'], 404);
        }

        $results = [];
        $addonCountBefore = WorkspaceAddon::count();

        for ($i = 1; $i <= $times; $i++) {
            $payload = $this->generatePayload($gateway, $workspace);
            $url = url($this->getWebhookUrl($gateway));

            try {
                $response = Http::timeout(10)->post($url, $payload);
                
                $results[] = [
                    'attempt' => $i,
                    'status' => $response->status(),
                    'body' => $response->json() ?? $response->body(),
                    'success' => $response->successful(),
                ];
            } catch (\Exception $e) {
                $results[] = [
                    'attempt' => $i,
                    'error' => $e->getMessage(),
                    'success' => false,
                ];
            }

            if ($i < $times) {
                usleep(500000); // 0.5 segundos entre requests
            }
        }

        $addonCountAfter = WorkspaceAddon::count();
        $addonsCreated = $addonCountAfter - $addonCountBefore;

        return response()->json([
            'success' => true,
            'gateway' => $gateway,
            'workspace_id' => $workspaceId,
            'attempts' => $times,
            'results' => $results,
            'addons_before' => $addonCountBefore,
            'addons_after' => $addonCountAfter,
            'addons_created' => $addonsCreated,
            'idempotency_working' => $addonsCreated === 1,
            'recent_events' => WebhookEvent::latest()->take(3)->get(),
        ]);
    }

    private function generatePayload(string $gateway, Workspace $workspace): array
    {
        $uniqueId = uniqid();

        switch ($gateway) {
            case 'stripe':
                return [
                    'id' => 'evt_test_' . $uniqueId,
                    'type' => 'checkout.session.completed',
                    'data' => [
                        'object' => [
                            'id' => 'cs_test_' . $uniqueId,
                            'payment_intent' => 'pi_test_' . $uniqueId,
                            'amount_total' => 1000,
                            'metadata' => [
                                'addon_sku' => 'ai_100',
                                'workspace_id' => $workspace->id,
                                'quantity' => '1',
                            ],
                        ],
                    ],
                ];

            case 'wompi':
                return [
                    'event' => 'transaction.updated',
                    'data' => [
                        'transaction' => [
                            'id' => 'wompi_test_' . $uniqueId,
                            'status' => 'APPROVED',
                            'amount_in_cents' => 50000,
                            'metadata' => [
                                'type' => 'addon',
                                'workspace_id' => $workspace->id,
                                'user_id' => $workspace->creator->id ?? 1,
                                'addon_sku' => 'ai_100',
                                'addon_amount' => '100',
                                'addon_type' => 'ai_credits',
                            ],
                        ],
                    ],
                ];

            case 'payu':
                return [
                    'state_pol' => '4',
                    'transaction_id' => 'payu_test_' . $uniqueId,
                    'reference_sale' => "ADDON_{$workspace->id}_ai_100_" . time(),
                    'value' => '10.00',
                    'currency' => 'USD',
                    'sign' => 'test_signature',
                ];

            case 'mercadopago':
                return [
                    'type' => 'payment',
                    'data' => [
                        'id' => 'mp_test_' . $uniqueId,
                    ],
                ];

            case 'epayco':
                return [
                    'x_transaction_state' => 'Aceptada',
                    'x_ref_payco' => 'epayco_test_' . $uniqueId,
                    'x_extra1' => $workspace->id,
                    'x_extra2' => $workspace->creator->id ?? 1,
                    'x_extra3' => 'ai_100',
                    'x_extra4' => 'addon',
                    'x_amount' => '10.00',
                    'x_currency_code' => 'COP',
                ];

            default:
                throw new \InvalidArgumentException("Unknown gateway: {$gateway}");
        }
    }

    private function getWebhookUrl(string $gateway): string
    {
        return match ($gateway) {
            'stripe' => '/webhooks/stripe/addon',
            'wompi' => '/webhooks/wompi',
            'payu' => '/webhooks/payu',
            'mercadopago' => '/webhooks/mercadopago',
            'epayco' => '/webhooks/epayco',
            default => throw new \InvalidArgumentException("Unknown gateway: {$gateway}"),
        };
    }

    public function clearTestData()
    {
        // Eliminar eventos de prueba
        WebhookEvent::where('event_id', 'like', '%test_%')->delete();
        
        // Eliminar addons de prueba
        WorkspaceAddon::where('stripe_payment_intent_id', 'like', '%test_%')->delete();

        return response()->json(['success' => true, 'message' => 'Test data cleared']);
    }
}