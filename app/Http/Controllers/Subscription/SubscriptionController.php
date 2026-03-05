<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use App\Models\Workspace\Workspace;
use App\Models\Subscription\Subscription as SubscriptionModel;
use App\Services\Usage\UsageTrackingService;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function __construct(
            private UsageTrackingService $usageTracking,
            private \App\Services\PlanManagementService $planManagement,
            private \App\Services\SubscriptionTrackingService $subscriptionTracking
        ) {}

    public function createCheckoutSession(Request $request): JsonResponse
    {
        $request->validate([
            'plan' => 'required|in:starter,professional,enterprise',
        ]);

        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();
        
        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        $plan = config("plans.{$request->plan}");

        if (!$plan['stripe_price_id']) {
            return response()->json(['error' => 'Invalid plan configuration'], 400);
        }

        try {
            // Usar Laravel Cashier para crear la sesión de checkout
            $checkout = $workspace
                ->newSubscription('default', $plan['stripe_price_id'])
                ->checkout([
                    'success_url' => url('/subscription/success') . '?session_id={CHECKOUT_SESSION_ID}&plan=' . $request->plan,
                    'cancel_url' => url('/subscription/cancel'),
                    'metadata' => [
                        'workspace_id' => $workspace->id,
                        'user_id' => $request->user()->id,
                        'plan' => $request->plan,
                    ],
                ]);

            return response()->json(['url' => $checkout->url]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create checkout session',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Manejar webhook de Stripe después de que se complete la suscripción
     */
    public function handleSubscriptionCreated(Request $request): void
    {
        $stripeSubscription = $request->input('data.object');
        $workspaceId = $stripeSubscription['metadata']['workspace_id'] ?? null;
        $userId = $stripeSubscription['metadata']['user_id'] ?? null;
        $plan = $stripeSubscription['metadata']['plan'] ?? 'starter';

        if (!$workspaceId || !$userId) {
            return;
        }

        $workspace = Workspace::find($workspaceId);
        $user = \App\Models\User::find($userId);
        
        if (!$workspace || !$user) {
            return;
        }

        // Get current plan for history
        $currentHistory = $user->subscriptionHistory()->active()->first();
        $previousPlan = $currentHistory?->plan_name;

        // Actualizar o crear la suscripción personalizada (sistema antiguo)
        $subscription = $workspace->subscription;

        if ($subscription) {
            $subscription->update([
                'stripe_subscription_id' => $stripeSubscription['id'],
                'plan' => $plan,
                'status' => 'active',
                'trial_ends_at' => null,
            ]);
        } else {
            $subscription = $workspace->subscription()->create([
                'stripe_subscription_id' => $stripeSubscription['id'],
                'plan' => $plan,
                'status' => 'active',
            ]);
        }

        // Inicializar métricas de uso (sistema antiguo)
        $this->initializeUsageMetrics($workspace, $plan);

        // IMPORTANTE: Actualizar sistema nuevo (SubscriptionHistory)
        $planConfig = config("plans.{$plan}");
        
        $this->subscriptionTracking->recordPlanChange(
            user: $user,
            newPlan: $plan,
            previousPlan: $previousPlan,
            stripePriceId: $stripeSubscription['items']['data'][0]['price']['id'] ?? null,
            price: $planConfig['price'] ?? 0,
            billingCycle: 'monthly',
            reason: 'stripe_payment_completed',
            metadata: [
                'stripe_subscription_id' => $stripeSubscription['id'],
                'stripe_customer_id' => $stripeSubscription['customer'] ?? null,
                'workspace_id' => $workspaceId,
            ]
        );

        \Log::info('Subscription created via Stripe', [
            'user_id' => $userId,
            'workspace_id' => $workspaceId,
            'plan' => $plan,
            'stripe_subscription_id' => $stripeSubscription['id'],
        ]);
    }

    private function initializeUsageMetrics(Workspace $workspace, string $plan): void
    {
        $limits = config("plans.{$plan}.limits");
        
        foreach (['publications', 'storage', 'ai_requests'] as $metric) {
            $limitKey = match($metric) {
                'publications' => 'publications_per_month',
                'ai_requests' => 'ai_requests_per_month',
                'storage' => 'storage_gb',
            };

            $workspace->usageMetrics()->updateOrCreate(
                [
                    'metric_type' => $metric,
                    'period_start' => now()->startOfMonth(),
                    'period_end' => now()->endOfMonth(),
                ],
                [
                    'current_usage' => 0,
                    'limit' => $limits[$limitKey] ?? 0,
                ]
            );
        }
    }

    public function getUsage(Request $request): JsonResponse
    {
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();
        
        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        $usage = $this->usageTracking->getAllUsageMetrics($workspace);
        $subscription = $workspace->subscription;

        return response()->json([
            'subscription' => [
                'plan' => $subscription->plan ?? 'free',
                'status' => $subscription->status ?? 'inactive',
                'trial_ends_at' => $subscription->trial_ends_at ?? null,
            ],
            'usage' => $usage,
        ]);
    }

    public function cancelSubscription(Request $request): JsonResponse
    {
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();
        
        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        try {
            // Usar Laravel Cashier para cancelar la suscripción
            $workspace->subscription('default')->cancel();

            // Actualizar nuestra tabla personalizada
            if ($workspace->subscription) {
                $workspace->subscription->update([
                    'status' => 'canceled',
                    'ends_at' => now(),
                ]);
            }

            return response()->json(['message' => 'Subscription canceled successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to cancel subscription',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function activateFreePlan(Request $request): RedirectResponse
        {
            $request->validate([
                'plan' => 'required|in:free,demo',
            ]);

            $user = $request->user();
            $plan = $request->plan;
            $planConfig = config("plans.{$plan}");

            // Verificar si el plan demo está habilitado
            if ($plan === 'demo' && !($planConfig['enabled'] ?? true)) {
                return back()->with('error', 'El plan demo no está disponible en este momento.');
            }

            try {
                // Usar el servicio centralizado
                $success = $this->planManagement->changePlan(
                    user: $user,
                    newPlan: $plan,
                    reason: 'user_initiated',
                    metadata: $plan === 'demo' ? [
                        'trial_days' => $planConfig['trial_days'] ?? 30,
                        'trial_ends_at' => now()->addDays($planConfig['trial_days'] ?? 30)->toDateTimeString()
                    ] : null
                );

                if (!$success) {
                    throw new \Exception('Failed to activate plan');
                }

                return back()->with('success', __('Plan activado exitosamente'));
            } catch (\Exception $e) {
                \Log::error('Failed to activate free plan', [
                    'user_id' => $user->id,
                    'plan' => $plan,
                    'error' => $e->getMessage()
                ]);

                return back()->with('error', 'Error al activar el plan. Por favor, intenta de nuevo.');
            }
        }

    public function resumeSubscription(Request $request): JsonResponse
    {
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspaces()->first();
        
        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        try {
            // Usar Laravel Cashier para reanudar la suscripción
            $workspace->subscription('default')->resume();

            // Actualizar nuestra tabla personalizada
            if ($workspace->subscription) {
                $workspace->subscription->update([
                    'status' => 'active',
                    'ends_at' => null,
                ]);
            }

            return response()->json(['message' => 'Subscription resumed successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to resume subscription',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function changePlan(Request $request): JsonResponse
        {
            $request->validate([
                'plan' => 'required|in:free,starter,professional,enterprise',
            ]);

            $user = $request->user();
            $newPlan = $request->plan;
            $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

            if (!$workspace) {
                return response()->json(['error' => 'No workspace found'], 404);
            }

            // Get current active subscription
            $currentHistory = $user->subscriptionHistory()->active()->first();
            $previousPlan = $currentHistory?->plan_name;

            try {
                // Get plan configuration
                $planConfig = config("plans.{$newPlan}");

                if (!$planConfig) {
                    return response()->json(['error' => 'Invalid plan configuration'], 400);
                }

                // Verificar si el usuario tiene una suscripción activa en Stripe
                // Usar el método de Cashier correctamente
                $hasActiveStripeSubscription = false;
                $cashierSubscription = null;
                try {
                    // Verificar si tiene suscripción activa usando Cashier
                    $cashierSubscription = $workspace->subscriptions()
                        ->where('type', 'default')
                        ->where('stripe_status', 'active')
                        ->first();
                    
                    // Verificar que el stripe_id sea válido (debe empezar con 'sub_')
                    if ($cashierSubscription && str_starts_with($cashierSubscription->stripe_id, 'sub_')) {
                        $hasActiveStripeSubscription = true;
                    } else {
                        // Si el stripe_id no es válido, no es una suscripción real de Stripe
                        $cashierSubscription = null;
                        $hasActiveStripeSubscription = false;
                    }
                    
                    \Log::info('Checking subscription for plan change', [
                        'user_id' => $user->id,
                        'workspace_id' => $workspace->id,
                        'new_plan' => $newPlan,
                        'has_active_subscription' => $hasActiveStripeSubscription,
                        'subscription_id' => $cashierSubscription?->stripe_id
                    ]);
                } catch (\Exception $e) {
                    \Log::warning('Error checking Stripe subscription', [
                        'workspace_id' => $workspace->id,
                        'error' => $e->getMessage()
                    ]);
                }

                // Si el usuario tiene una suscripción activa en Stripe, puede cambiar libremente entre cualquier plan
                // porque ya pagó. Solo actualizamos su preferencia de plan en el sistema.
                // NO hacemos cambios en Stripe - el usuario mantiene su suscripción activa.
                
                // Si NO tiene suscripción activa y quiere un plan de pago, debe comprar
                if (!$hasActiveStripeSubscription && $newPlan !== 'free' && $newPlan !== 'demo' && isset($planConfig['stripe_price_id'])) {
                    return response()->json([
                        'error' => 'No active subscription',
                        'message' => 'Debes suscribirte primero para acceder a este plan',
                        'requires_checkout' => true
                    ], 402); // 402 Payment Required
                }

                // Actualizar el campo current_plan del usuario
                $user->update(['current_plan' => $newPlan]);

                // Record plan change in our tracking system
                $this->subscriptionTracking->recordPlanChange(
                    user: $user,
                    newPlan: $newPlan,
                    previousPlan: $previousPlan,
                    stripePriceId: $planConfig['stripe_price_id'] ?? null,
                    price: $planConfig['price'] ?? 0,
                    billingCycle: $planConfig['billing_cycle'] ?? 'monthly',
                    reason: 'user_initiated'
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Plan changed successfully',
                    'plan' => $newPlan,
                    'had_active_subscription' => $hasActiveStripeSubscription
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to change plan', [
                    'user_id' => $user->id,
                    'new_plan' => $newPlan,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                return response()->json([
                    'error' => 'Failed to change plan',
                    'message' => $e->getMessage(),
                ], 500);
            }
        }

    public function checkActiveSubscription(Request $request): JsonResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if (!$workspace) {
            return response()->json(['has_active_subscription' => false]);
        }

        try {
            $subscription = $workspace->subscriptions()
                ->where('type', 'default')
                ->where('stripe_status', 'active')
                ->first();

            // Verificar que el stripe_id sea válido (debe empezar con 'sub_')
            $hasActiveSubscription = $subscription && str_starts_with($subscription->stripe_id, 'sub_');

            return response()->json([
                'has_active_subscription' => $hasActiveSubscription
            ]);
        } catch (\Exception $e) {
            \Log::error('Error checking active subscription', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return response()->json(['has_active_subscription' => false]);
        }
    }

    private function updateUsageMetrics(Workspace $workspace, string $plan): void
    {
        $limits = config("plans.{$plan}.limits");
        
        foreach (['publications', 'storage', 'ai_requests'] as $metric) {
            $limitKey = match($metric) {
                'publications' => 'publications_per_month',
                'ai_requests' => 'ai_requests_per_month',
                'storage' => 'storage_gb',
            };

            $workspace->usageMetrics()
                ->where('metric_type', $metric)
                ->where('period_start', '<=', now())
                ->where('period_end', '>=', now())
                ->update([
                    'limit' => $limits[$limitKey] ?? 0,
                ]);
        }
    }
}
