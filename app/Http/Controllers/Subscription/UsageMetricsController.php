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

            // Obtener historial de facturación desde subscription_history
            $invoices = [];
            $upcomingInvoice = null;

            // Obtener facturas del historial de suscripciones (pagos completados)
            $invoices = $user->subscriptionHistory()
                ->whereNotNull('ended_at') // Solo períodos completados
                ->where('price', '>', 0) // Solo planes de pago
                ->orderBy('ended_at', 'desc')
                ->get()
                ->map(function ($history) {
                    return [
                        'id' => $history->id,
                        'date' => $history->ended_at->toDateTimeString(),
                        'total' => $history->price,
                        'status' => 'paid',
                        'invoice_pdf' => null, // Podría agregarse en el futuro
                    ];
                })
                ->toArray();

            // Obtener próxima factura (período activo actual)
            if ($activeHistory && $activeHistory->price > 0) {
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
}
