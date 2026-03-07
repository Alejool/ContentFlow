<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\Usage\UsageTrackingService;

class UsageMetricsController extends Controller
{
    public function __construct(
            private UsageTrackingService $usageTracking,
            private \App\Services\SubscriptionTrackingService $subscriptionTracking
        ) {}

    public function index(Request $request): Response
        {
            $user = $request->user();
            $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

            if (!$workspace) {
                abort(404, 'No workspace found');
            }

            // Get subscription from new tracking system
            $activeHistory = $user->subscriptionHistory()->active()->first();
            $currentUsage = $this->subscriptionTracking->getCurrentMonthUsage($user);

            // Get old system subscription for backward compatibility
            $subscription = $workspace->subscription;
            $usage = $this->usageTracking->getAllUsageMetrics($workspace);

            // Obtener historial de facturación (si existe)
            $billingHistory = [];
            if ($subscription && $subscription->stripe_id && $subscription->stripe_id !== 'free_' . $workspace->id) {
                try {
                    // Aquí podrías obtener las facturas de Stripe
                    // $billingHistory = $workspace->invoices();
                } catch (\Exception $e) {
                    // Ignorar errores de Stripe en desarrollo
                }
            }

            return Inertia::render('Subscription/UsageMetrics', [
                'subscription' => [
                    'plan' => $activeHistory?->plan_name ?? 'free',
                    'plan_id' => $activeHistory?->plan_name ?? 'free',
                    'status' => $activeHistory?->is_active ? 'active' : 'inactive',
                    'stripe_status' => $subscription?->stripe_status ?? 'active',
                    'trial_ends_at' => $subscription?->trial_ends_at ?? null,
                ],
                'usage' => $usage,
                'billingHistory' => $billingHistory,
            ]);
        }

    public function billing(Request $request): Response
        {
            $user = $request->user();
            $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

            if (!$workspace) {
                abort(404, 'No workspace found');
            }

            // Get subscription from new tracking system
            $activeHistory = $user->subscriptionHistory()->active()->first();
            $currentUsage = $this->subscriptionTracking->getCurrentMonthUsage($user);

            // Get old system subscription for Stripe integration
            $subscription = $workspace->subscription;

            // Obtener historial de facturación con paginación
            $invoices = [];
            $upcomingInvoice = null;
            $perPage = $request->input('per_page', 10); // Facturas por página (configurable)
            $perPage = min(max((int)$perPage, 5), 25); // Limitar entre 5 y 25
            $currentPage = $request->input('page', 1);

            // Obtener facturas de la base de datos local (sincronizadas desde Stripe)
            $query = \App\Models\Subscription\StripeInvoice::where('workspace_id', $workspace->id)
                ->orderBy('invoice_date', 'desc');
            
            $paginatedInvoices = $query->paginate($perPage, ['*'], 'page', $currentPage);
            
            $invoices = [
                'data' => $paginatedInvoices->map(function ($invoice) {
                    return [
                        'id' => $invoice->stripe_invoice_id,
                        'date' => $invoice->invoice_date->toDateTimeString(),
                        'total' => (float) $invoice->total,
                        'status' => $invoice->status,
                        'invoice_pdf' => $invoice->invoice_pdf,
                        'hosted_invoice_url' => $invoice->hosted_invoice_url,
                        'plan_name' => $invoice->plan_name,
                        'description' => $invoice->description,
                        'currency' => $invoice->currency,
                    ];
                })->toArray(),
                'current_page' => $paginatedInvoices->currentPage(),
                'per_page' => $paginatedInvoices->perPage(),
                'total' => $paginatedInvoices->total(),
                'last_page' => $paginatedInvoices->lastPage(),
                'from' => $paginatedInvoices->firstItem(),
                'to' => $paginatedInvoices->lastItem(),
            ];


            // Si no hay próxima factura de Stripe, calcular desde historial activo
            if (!$upcomingInvoice && $activeHistory && $activeHistory->price > 0) {
                $nextBillingDate = $activeHistory->started_at->copy();
                if ($activeHistory->billing_cycle === 'yearly') {
                    $nextBillingDate->addYear();
                } else {
                    $nextBillingDate->addMonth();
                }

                $upcomingInvoice = [
                    'date' => $nextBillingDate->toDateTimeString(),
                    'total' => $activeHistory->price,
                ];
            }

            // Prepare subscription data from new system
            $subscriptionData = [
                'plan' => $activeHistory?->plan_name ?? 'free',
                'plan_id' => $activeHistory?->plan_name ?? 'free',
                'plan_name' => $activeHistory?->plan_name ?? 'Free',
                'status' => $activeHistory?->is_active ? 'active' : 'inactive',
                'stripe_status' => $subscription?->stripe_status ?? 'active',
                'trial_ends_at' => $subscription?->trial_ends_at ?? null,
                'ends_at' => $subscription?->ends_at ?? null,
                'current_period_end' => $activeHistory?->ended_at ?? null,
                'is_trial' => $subscription?->trial_ends_at && now()->lt($subscription->trial_ends_at),
            ];

            // Prepare usage data from new system
            $usageData = null;
            if ($currentUsage) {
                $usageData = [
                    'publications_used' => $currentUsage->publications_used,
                    'publications_limit' => $currentUsage->publications_limit,
                    'storage_used' => $currentUsage->storage_used_bytes,
                    'storage_limit' => $currentUsage->storage_limit_bytes,
                    'ai_requests_used' => $currentUsage->ai_requests_used,
                    'ai_requests_limit' => $currentUsage->ai_requests_limit,
                ];
            }

            return Inertia::render('Subscription/Billing', [
                'subscription' => $subscriptionData,
                'usage' => $usageData,
                'invoices' => $invoices,
                'upcomingInvoice' => $upcomingInvoice,
            ]);
        }

    public function billingPortal(Request $request)
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if (!$workspace) {
            if ($request->expectsJson()) {
                return response()->json(['error' => __('No workspace found')], 404);
            }
            return redirect()->back()->with('error', __('No workspace found'));
        }

        $subscription = $workspace->subscription;

        // Verificar si el workspace tiene una suscripción válida de Stripe
        if (!$subscription || 
            !$subscription->stripe_id || 
            str_starts_with($subscription->stripe_id, 'free_') || 
            str_starts_with($subscription->stripe_id, 'demo_')) {
            $message = __('No tienes una suscripción activa de Stripe. El portal de facturación solo está disponible para suscripciones de pago reales.');
            if ($request->expectsJson()) {
                return response()->json(['error' => $message], 400);
            }
            return redirect()->back()->with('error', $message);
        }

        try {
            // Verificar que el workspace tenga un stripe_id válido
            if (!$workspace->stripe_id) {
                if ($request->expectsJson()) {
                    return response()->json(['error' => __('No se encontró información de cliente en Stripe. Por favor, contacta con soporte.')], 400);
                }
                return redirect()->back()->with('error', __('No se encontró información de cliente en Stripe. Por favor, contacta con soporte.'));
            }

            // Crear sesión del portal de facturación de Stripe con configuración personalizada
            $returnUrl = route('subscription.billing');
            
            // Crear la sesión del portal con opciones para permitir actualización de método de pago
            $stripe = new \Stripe\StripeClient(config('cashier.secret'));
            
            $sessionParams = [
                'customer' => $workspace->stripe_id,
                'return_url' => $returnUrl,
            ];
            
            // Si hay un ID de configuración personalizada, usarlo
            if ($configId = config('cashier.billing_portal.configuration_id')) {
                $sessionParams['configuration'] = $configId;
            }
            
            $portalSession = $stripe->billingPortal->sessions->create($sessionParams);
            
            // Devolver la URL para que el frontend haga la redirección
            return response()->json(['url' => $portalSession->url]);
        } catch (\Exception $e) {
            \Log::error('Error creating billing portal session: ' . $e->getMessage(), [
                'workspace_id' => $workspace->id,
                'workspace_stripe_id' => $workspace->stripe_id ?? 'none',
                'subscription_stripe_id' => $subscription->stripe_id ?? 'none',
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => __('No se pudo acceder al portal de facturación. Por favor, intenta más tarde.')], 500);
        }
    }

    public function cancelSubscription(Request $request)
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => __('No workspace found')], 404);
        }

        $subscription = $workspace->subscription;

        // Verificar si el workspace tiene una suscripción válida de Stripe
        if (!$subscription ||
            !$subscription->stripe_id ||
            str_starts_with($subscription->stripe_id, 'free_') ||
            str_starts_with($subscription->stripe_id, 'demo_')) {
            return response()->json([
                'error' => __('La cancelación solo está disponible para suscripciones de pago reales de Stripe. Tu suscripción actual es manual/sandbox.')
            ], 400);
        }

        try {
            // Cancelar la suscripción al final del período de facturación
            $workspace->subscription('default')->cancel();

            \Log::info('Subscription cancelled successfully', [
                'workspace_id' => $workspace->id,
                'subscription_id' => $subscription->stripe_id,
                'ends_at' => $subscription->ends_at,
            ]);

            return response()->json([
                'success' => true,
                'message' => __('Tu suscripción ha sido cancelada. Tendrás acceso hasta el final del período de facturación actual.')
            ]);
        } catch (\Exception $e) {
            \Log::error('Error cancelling subscription: ' . $e->getMessage(), [
                'workspace_id' => $workspace->id,
                'subscription_stripe_id' => $subscription->stripe_id ?? 'none',
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['error' => __('No se pudo cancelar la suscripción. Por favor, intenta más tarde.')], 500);
        }
    }


    /**
     * Exportar historial de facturas a Excel (CSV)
     * Solo exporta facturas de Stripe
     */
    public function exportInvoices(Request $request)
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        $subscription = $workspace->subscription;

        // Obtener facturas de la base de datos local
        $invoices = \App\Models\Subscription\StripeInvoice::where('workspace_id', $workspace->id)
            ->orderBy('invoice_date', 'desc')
            ->get()
            ->map(function ($invoice) {
                return [
                    'invoice_number' => $invoice->invoice_number ?? $invoice->stripe_invoice_id,
                    'date' => $invoice->invoice_date->format('Y-m-d'),
                    'plan_name' => $invoice->plan_name,
                    'description' => $invoice->description,
                    'subtotal' => (float) $invoice->subtotal,
                    'tax' => (float) $invoice->tax,
                    'total' => (float) $invoice->total,
                    'currency' => $invoice->currency,
                    'status' => ucfirst($invoice->status),
                    'pdf_url' => $invoice->invoice_pdf ?? '',
                    'hosted_url' => $invoice->hosted_invoice_url ?? '',
                ];
            })->toArray();

        // Si no hay facturas, retornar error
        if (empty($invoices)) {
            return response()->json([
                'error' => 'No hay facturas disponibles para exportar.'
            ], 404);
        }

        // Crear CSV con formato mejorado
        $filename = 'facturas_stripe_' . $workspace->id . '_' . date('Y-m-d_His') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function() use ($invoices, $workspace) {
            $file = fopen('php://output', 'w');
            
            // BOM para UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Información del workspace
            fputcsv($file, ['Historial de Facturas - ' . $workspace->name], ';');
            fputcsv($file, ['Exportado el: ' . date('Y-m-d H:i:s')], ';');
            fputcsv($file, [''], ';'); // Línea en blanco
            
            // Encabezados
            fputcsv($file, [
                'Número de Factura',
                'Fecha',
                'Plan',
                'Descripción',
                'Subtotal',
                'Impuestos',
                'Total',
                'Moneda',
                'Estado',
                'URL PDF',
                'URL Factura'
            ], ';');
            
            // Datos
            foreach ($invoices as $invoice) {
                fputcsv($file, [
                    $invoice['invoice_number'],
                    $invoice['date'],
                    $invoice['plan_name'],
                    $invoice['description'],
                    number_format($invoice['subtotal'], 2, ',', '.'),
                    number_format($invoice['tax'], 2, ',', '.'),
                    number_format($invoice['total'], 2, ',', '.'),
                    $invoice['currency'],
                    $invoice['status'],
                    $invoice['pdf_url'],
                    $invoice['hosted_url'],
                ], ';');
            }
            
            // Resumen al final
            fputcsv($file, [''], ';'); // Línea en blanco
            $totalAmount = array_sum(array_column($invoices, 'total'));
            fputcsv($file, ['Total General:', '', '', '', '', '', number_format($totalAmount, 2, ',', '.'), $invoices[0]['currency'] ?? 'USD'], ';');
            fputcsv($file, ['Total de Facturas:', count($invoices)], ';');
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
