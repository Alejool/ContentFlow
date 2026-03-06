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

            // Intentar obtener facturas reales de Stripe si hay suscripción activa
            if ($subscription && $subscription->stripe_id && str_starts_with($subscription->stripe_id, 'sub_')) {
                try {
                    // Obtener facturas de Stripe usando Laravel Cashier
                    $stripeInvoices = $workspace->invoices();
                    
                    $allInvoices = collect($stripeInvoices)->map(function ($invoice) {
                        // Obtener información del plan desde las líneas de la factura
                        $planName = 'N/A';
                        $description = 'Suscripción';
                        
                        try {
                            $stripeInvoice = $invoice->asStripeInvoice();
                            if ($stripeInvoice->lines && $stripeInvoice->lines->data) {
                                $firstLine = $stripeInvoice->lines->data[0] ?? null;
                                if ($firstLine) {
                                    $description = $firstLine->description ?? 'Suscripción';
                                    // Extraer nombre del plan de la descripción
                                    if ($firstLine->price && $firstLine->price->metadata) {
                                        $planName = $firstLine->price->metadata['plan_name'] ?? $planName;
                                    }
                                }
                            }
                        } catch (\Exception $e) {
                            \Log::warning('Could not extract plan info from invoice', [
                                'invoice_id' => $invoice->id,
                                'error' => $e->getMessage()
                            ]);
                        }
                        
                        return [
                            'id' => $invoice->id,
                            'date' => $invoice->date()->toDateTimeString(),
                            'total' => $invoice->total() / 100,
                            'status' => $invoice->status,
                            'invoice_pdf' => $invoice->invoice_pdf ?? null,
                            'hosted_invoice_url' => $invoice->hosted_invoice_url ?? null,
                            'plan_name' => $planName,
                            'description' => $description,
                            'currency' => strtoupper($invoice->currency ?? 'usd'),
                        ];
                    });
                    
                    // Paginar manualmente
                    $total = $allInvoices->count();
                    $invoices = [
                        'data' => $allInvoices->forPage($currentPage, $perPage)->values()->toArray(),
                        'current_page' => $currentPage,
                        'per_page' => $perPage,
                        'total' => $total,
                        'last_page' => ceil($total / $perPage),
                        'from' => (($currentPage - 1) * $perPage) + 1,
                        'to' => min($currentPage * $perPage, $total),
                    ];

                    // Obtener próxima factura de Stripe
                    try {
                        $upcomingStripeInvoice = $workspace->upcomingInvoice();
                        if ($upcomingStripeInvoice) {
                            $upcomingInvoice = [
                                'date' => $upcomingStripeInvoice->date()->toDateTimeString(),
                                'total' => $upcomingStripeInvoice->total() / 100,
                            ];
                        }
                    } catch (\Exception $e) {
                        \Log::warning('Could not fetch upcoming invoice from Stripe', [
                            'workspace_id' => $workspace->id,
                            'error' => $e->getMessage()
                        ]);
                    }
                } catch (\Exception $e) {
                    \Log::warning('Could not fetch invoices from Stripe', [
                        'workspace_id' => $workspace->id,
                        'error' => $e->getMessage()
                    ]);
                    
                    // Fallback: usar historial de suscripciones con paginación
                    $query = $user->subscriptionHistory()
                        ->whereNotNull('ended_at')
                        ->where('price', '>', 0)
                        ->orderBy('ended_at', 'desc');
                    
                    $paginatedHistory = $query->paginate($perPage, ['*'], 'page', $currentPage);
                    
                    $invoices = [
                        'data' => $paginatedHistory->map(function ($history) {
                            return [
                                'id' => $history->id,
                                'date' => $history->ended_at->toDateTimeString(),
                                'total' => $history->price,
                                'status' => 'paid',
                                'invoice_pdf' => null,
                                'hosted_invoice_url' => null,
                                'plan_name' => ucfirst($history->plan_name),
                                'description' => 'Suscripción ' . ucfirst($history->plan_name),
                                'currency' => 'USD',
                            ];
                        })->toArray(),
                        'current_page' => $paginatedHistory->currentPage(),
                        'per_page' => $paginatedHistory->perPage(),
                        'total' => $paginatedHistory->total(),
                        'last_page' => $paginatedHistory->lastPage(),
                        'from' => $paginatedHistory->firstItem(),
                        'to' => $paginatedHistory->lastItem(),
                    ];
                }
            } else {
                // Si no hay suscripción de Stripe, usar historial de suscripciones con paginación
                $query = $user->subscriptionHistory()
                    ->whereNotNull('ended_at')
                    ->where('price', '>', 0)
                    ->orderBy('ended_at', 'desc');
                
                $paginatedHistory = $query->paginate($perPage, ['*'], 'page', $currentPage);
                
                $invoices = [
                    'data' => $paginatedHistory->map(function ($history) {
                        return [
                            'id' => $history->id,
                            'date' => $history->ended_at->toDateTimeString(),
                            'total' => $history->price,
                            'status' => 'paid',
                            'invoice_pdf' => null,
                            'hosted_invoice_url' => null,
                            'plan_name' => ucfirst($history->plan_name),
                            'description' => 'Suscripción ' . ucfirst($history->plan_name),
                            'currency' => 'USD',
                        ];
                    })->toArray(),
                    'current_page' => $paginatedHistory->currentPage(),
                    'per_page' => $paginatedHistory->perPage(),
                    'total' => $paginatedHistory->total(),
                    'last_page' => $paginatedHistory->lastPage(),
                    'from' => $paginatedHistory->firstItem(),
                    'to' => $paginatedHistory->lastItem(),
                ];
            }

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
            return redirect()->back()->with('error', __('No workspace found'));
        }

        $subscription = $workspace->subscription;

        // Verificar si el workspace tiene una suscripción válida de Stripe
        if (!$subscription || 
            !$subscription->stripe_id || 
            str_starts_with($subscription->stripe_id, 'free_') || 
            str_starts_with($subscription->stripe_id, 'demo_')) {
            return redirect()->back()->with('error', __('No tienes una suscripción activa de Stripe. Por favor, suscríbete a un plan primero.'));
        }

        try {
            // Verificar que el workspace tenga un stripe_id válido
            if (!$workspace->stripe_id) {
                return redirect()->back()->with('error', __('No se encontró información de cliente en Stripe. Por favor, contacta con soporte.'));
            }

            // Crear sesión del portal de facturación de Stripe
            $returnUrl = route('subscription.billing');
            
            // Obtener la URL del portal en lugar de devolver la redirección
            $portalSession = $workspace->billingPortalUrl($returnUrl);
            
            // Devolver la URL para que el frontend haga la redirección
            return response()->json(['url' => $portalSession]);
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

    /**
     * Exportar historial de facturas a Excel
     */
    public function exportInvoices(Request $request)
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        $subscription = $workspace->subscription;
        $invoices = [];

        // Obtener todas las facturas (sin paginación para exportar)
        if ($subscription && $subscription->stripe_id && str_starts_with($subscription->stripe_id, 'sub_')) {
            try {
                $stripeInvoices = $workspace->invoices();
                
                $invoices = collect($stripeInvoices)->map(function ($invoice) {
                    $planName = 'N/A';
                    $description = 'Suscripción';
                    
                    try {
                        $stripeInvoice = $invoice->asStripeInvoice();
                        if ($stripeInvoice->lines && $stripeInvoice->lines->data) {
                            $firstLine = $stripeInvoice->lines->data[0] ?? null;
                            if ($firstLine) {
                                $description = $firstLine->description ?? 'Suscripción';
                            }
                        }
                    } catch (\Exception $e) {
                        // Ignorar errores
                    }
                    
                    return [
                        'date' => $invoice->date()->format('Y-m-d'),
                        'plan_name' => $planName,
                        'description' => $description,
                        'total' => $invoice->total() / 100,
                        'currency' => strtoupper($invoice->currency ?? 'usd'),
                        'status' => ucfirst($invoice->status),
                    ];
                })->toArray();
            } catch (\Exception $e) {
                // Fallback al historial
                $invoices = $user->subscriptionHistory()
                    ->whereNotNull('ended_at')
                    ->where('price', '>', 0)
                    ->orderBy('ended_at', 'desc')
                    ->get()
                    ->map(function ($history) {
                        return [
                            'date' => $history->ended_at->format('Y-m-d'),
                            'plan_name' => ucfirst($history->plan_name),
                            'description' => 'Suscripción ' . ucfirst($history->plan_name),
                            'total' => $history->price,
                            'currency' => 'USD',
                            'status' => 'Pagado',
                        ];
                    })->toArray();
            }
        } else {
            $invoices = $user->subscriptionHistory()
                ->whereNotNull('ended_at')
                ->where('price', '>', 0)
                ->orderBy('ended_at', 'desc')
                ->get()
                ->map(function ($history) {
                    return [
                        'date' => $history->ended_at->format('Y-m-d'),
                        'plan_name' => ucfirst($history->plan_name),
                        'description' => 'Suscripción ' . ucfirst($history->plan_name),
                        'total' => $history->price,
                        'currency' => 'USD',
                        'status' => 'Pagado',
                    ];
                })->toArray();
        }

        // Crear CSV (más simple que Excel y no requiere librerías adicionales)
        $filename = 'facturas_' . date('Y-m-d') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function() use ($invoices) {
            $file = fopen('php://output', 'w');
            
            // BOM para UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Encabezados
            fputcsv($file, ['Fecha', 'Plan', 'Descripción', 'Monto', 'Moneda', 'Estado'], ';');
            
            // Datos
            foreach ($invoices as $invoice) {
                fputcsv($file, [
                    $invoice['date'],
                    $invoice['plan_name'],
                    $invoice['description'],
                    number_format($invoice['total'], 2, ',', '.'),
                    $invoice['currency'],
                    $invoice['status'],
                ], ';');
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
