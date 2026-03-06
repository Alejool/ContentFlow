<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use App\Models\Workspace\Workspace;
use App\Models\Subscription\Subscription;
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

        $user = $request->user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        // Verificar que el usuario es el owner del workspace
        if (!$workspace->isOwner($user)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Only the workspace owner can manage subscriptions',
            ], 403);
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
                        'user_id' => $user->id,
                        'plan' => $request->plan,
                    ],
                ]);

            return response()->json(['url' => $checkout->url]);
        } catch (\Exception $e) {
            \Log::error('Failed to create checkout session', [
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'plan' => $request->plan,
                'error' => $e->getMessage(),
            ]);

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
            $limitKey = match ($metric) {
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
        $user = $request->user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        $usageService = app(\App\Services\WorkspaceUsageService::class);
        $usageSummary = $usageService->getUsageSummary($workspace);

        // Agregar información de permisos
        $usageSummary['permissions'] = [
            'is_owner' => $workspace->isOwner($user),
            'can_manage_subscription' => $workspace->canManageSubscription($user),
            'can_upgrade' => $workspace->isOwner($user),
            'can_cancel' => $workspace->isOwner($user),
            'can_view_billing' => $workspace->isOwner($user),
        ];

        // Agregar información del owner
        $owner = $workspace->creator;
        if ($owner) {
            $usageSummary['workspace']['owner'] = [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
            ];
        }

        // Agregar información sobre cambios programados y cancelaciones
        $subscription = $workspace->subscription;
        if ($subscription) {
            $usageSummary['subscription']['pending_plan'] = $subscription->pending_plan;
            $usageSummary['subscription']['plan_changes_at'] = $subscription->plan_changes_at?->toIso8601String();
            $usageSummary['subscription']['cancel_at_period_end'] = $subscription->cancel_at_period_end ?? false;
            $usageSummary['subscription']['grace_period_ends_at'] = $subscription->grace_period_ends_at?->toIso8601String();

            // Calcular días restantes
            if ($subscription->ends_at) {
                $usageSummary['subscription']['days_remaining'] = now()->diffInDays($subscription->ends_at, false);
            }

            if ($subscription->grace_period_ends_at) {
                $usageSummary['subscription']['grace_period_days_remaining'] = now()->diffInDays($subscription->grace_period_ends_at, false);
            }
        }

        return response()->json($usageSummary);
    }

    public function getPermissions(Request $request): JsonResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        $owner = $workspace->creator;

        return response()->json([
            'is_owner' => $workspace->isOwner($user),
            'can_manage_subscription' => $workspace->canManageSubscription($user),
            'can_view_billing' => $workspace->isOwner($user),
            'can_upgrade' => $workspace->isOwner($user),
            'can_cancel' => $workspace->isOwner($user),
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
            ],
            'owner' => $owner ? [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
            ] : null,
        ]);
    }

    public function cancelSubscription(Request $request): JsonResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        // Verificar que el usuario es el owner
        if (!$workspace->isOwner($user)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Only the workspace owner can cancel subscriptions',
            ], 403);
        }

        try {
            $cashierSubscription = $workspace->subscription('default');

            if (!$cashierSubscription) {
                return response()->json([
                    'error' => 'No active subscription found',
                ], 404);
            }

            // Obtener la fecha de fin del período actual
            $stripeSubscription = $cashierSubscription->asStripeSubscription();
            $periodEnd = \Carbon\Carbon::createFromTimestamp($stripeSubscription->current_period_end);

            // Cancelar al final del período (NO inmediatamente)
            $cashierSubscription->cancel();

            // Actualizar nuestra tabla personalizada
            if ($workspace->subscription) {
                $workspace->subscription->update([
                    'status' => 'canceled',
                    'cancel_at_period_end' => true,
                    'ends_at' => $periodEnd,
                    'cancellation_reason' => $request->input('reason', 'user_requested'),
                ]);
            }

            \Log::info('Subscription canceled at period end', [
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'ends_at' => $periodEnd,
            ]);

            return response()->json([
                'message' => 'Tu suscripción se cancelará al final del período actual',
                'ends_at' => $periodEnd->toIso8601String(),
                'days_remaining' => now()->diffInDays($periodEnd),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to cancel subscription', [
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

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
        $previousPlan = $currentHistory?->plan_name ?? 'demo';

        try {
            // Get plan configuration
            $planConfig = config("plans.{$newPlan}");

            if (!$planConfig) {
                return response()->json(['error' => 'Invalid plan configuration'], 400);
            }

            // Verificar si el usuario tiene una suscripción activa en Stripe
            $hasActiveStripeSubscription = false;
            $cashierSubscription = null;
            try {
                $cashierSubscription = $workspace->subscriptions()
                    ->where('type', 'default')
                    ->where('stripe_status', 'active')
                    ->first();

                if ($cashierSubscription && str_starts_with($cashierSubscription->stripe_id, 'sub_')) {
                    $hasActiveStripeSubscription = true;
                } else {
                    $cashierSubscription = null;
                    $hasActiveStripeSubscription = false;
                }

                \Log::info('Checking subscription for plan change', [
                    'user_id' => $user->id,
                    'workspace_id' => $workspace->id,
                    'new_plan' => $newPlan,
                    'previous_plan' => $previousPlan,
                    'has_active_subscription' => $hasActiveStripeSubscription,
                    'subscription_id' => $cashierSubscription?->stripe_id
                ]);
            } catch (\Exception $e) {
                \Log::warning('Error checking Stripe subscription', [
                    'workspace_id' => $workspace->id,
                    'error' => $e->getMessage()
                ]);
            }

            // Determinar si es upgrade o downgrade
            $isDowngrade = $this->isDowngrade($previousPlan, $newPlan);
            $isUpgrade = $this->isUpgrade($previousPlan, $newPlan);

            // PREVENIR DOWNGRADE MANUAL DE PLAN DE PAGO A FREE O DEMO
            // Solo permitir downgrade automático cuando expire la suscripción
            if ($hasActiveStripeSubscription && ($newPlan === 'free' || $newPlan === 'demo') && $previousPlan !== 'free' && $previousPlan !== 'demo') {
                $planName = $newPlan === 'free' ? 'Free' : 'Demo';
                return response()->json([
                    'error' => 'Manual downgrade not allowed',
                    'message' => "No puedes cambiar manualmente a plan {$planName} mientras tengas una suscripción activa de pago. Para cambiar a {$planName}, cancela tu suscripción y espera a que termine el período de facturación actual.",
                    'requires_cancellation' => true,
                    'current_plan' => $previousPlan,
                    'attempted_plan' => $newPlan,
                ], 403);
            }

            // Si tiene suscripción activa en Stripe
            if ($hasActiveStripeSubscription && $newPlan !== 'free' && $newPlan !== 'demo' && isset($planConfig['stripe_price_id'])) {
                try {
                    if ($isDowngrade) {
                        // DOWNGRADE: Programar para el final del período
                        $stripeSubscription = $cashierSubscription->asStripeSubscription();
                        $periodEnd = \Carbon\Carbon::createFromTimestamp($stripeSubscription->current_period_end);

                        // Programar el cambio en Stripe para el final del período
                        $cashierSubscription->swap($planConfig['stripe_price_id'], [
                            'proration_behavior' => 'none', // No prorratear
                        ]);

                        // Marcar el downgrade pendiente en nuestra DB
                        $subscription = $workspace->subscription;
                        if ($subscription) {
                            $subscription->update([
                                'pending_plan' => $newPlan,
                                'plan_changes_at' => $periodEnd,
                            ]);
                        }

                        \Log::info('Downgrade scheduled for end of period', [
                            'workspace_id' => $workspace->id,
                            'current_plan' => $previousPlan,
                            'pending_plan' => $newPlan,
                            'changes_at' => $periodEnd,
                        ]);

                        return response()->json([
                            'success' => true,
                            'message' => 'Tu plan cambiará al final del ciclo de facturación actual',
                            'current_plan' => $previousPlan,
                            'pending_plan' => $newPlan,
                            'changes_at' => $periodEnd->toIso8601String(),
                            'is_downgrade' => true,
                        ]);
                    } else {
                        // UPGRADE: Aplicar inmediatamente con prorrateo
                        $cashierSubscription->swap($planConfig['stripe_price_id']);

                        \Log::info('Plan upgraded immediately in Stripe', [
                            'workspace_id' => $workspace->id,
                            'old_plan' => $previousPlan,
                            'new_plan' => $newPlan,
                            'stripe_price_id' => $planConfig['stripe_price_id']
                        ]);
                    }
                } catch (\Exception $e) {
                    \Log::error('Failed to change plan in Stripe', [
                        'workspace_id' => $workspace->id,
                        'error' => $e->getMessage()
                    ]);

                    return response()->json([
                        'error' => 'Failed to change plan in Stripe',
                        'message' => $e->getMessage(),
                    ], 500);
                }
            }

            // Si NO tiene suscripción activa y quiere un plan de pago, debe comprar
            if (!$hasActiveStripeSubscription && $newPlan !== 'free' && $newPlan !== 'demo' && isset($planConfig['stripe_price_id'])) {
                return response()->json([
                    'error' => 'No active subscription',
                    'message' => 'Debes suscribirte primero para acceder a este plan',
                    'requires_checkout' => true
                ], 402);
            }

            // Para upgrades o cambios a free/demo, actualizar inmediatamente
            if (!$isDowngrade || $newPlan === 'free' || $newPlan === 'demo') {
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
            }

            return response()->json([
                'success' => true,
                'message' => $isDowngrade ? 'El cambio se aplicará al final del período' : 'Plan actualizado exitosamente',
                'plan' => $isDowngrade ? $previousPlan : $newPlan,
                'pending_plan' => $isDowngrade ? $newPlan : null,
                'had_active_subscription' => $hasActiveStripeSubscription,
                'is_downgrade' => $isDowngrade,
                'is_upgrade' => $isUpgrade,
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

    /**
     * Determinar si un cambio de plan es un downgrade.
     */
    private function isDowngrade(string $currentPlan, string $newPlan): bool
    {
        $hierarchy = [
            'free' => 0,
            'demo' => 1,
            'starter' => 2,
            'professional' => 3,
            'enterprise' => 4,
        ];

        $currentLevel = $hierarchy[$currentPlan] ?? 0;
        $newLevel = $hierarchy[$newPlan] ?? 0;

        return $newLevel < $currentLevel;
    }

    /**
     * Determinar si un cambio de plan es un upgrade.
     */
    private function isUpgrade(string $currentPlan, string $newPlan): bool
    {
        $hierarchy = [
            'free' => 0,
            'demo' => 1,
            'starter' => 2,
            'professional' => 3,
            'enterprise' => 4,
        ];

        $currentLevel = $hierarchy[$currentPlan] ?? 0;
        $newLevel = $hierarchy[$newPlan] ?? 0;

        return $newLevel > $currentLevel;
    }

    public function checkActiveSubscription(Request $request): JsonResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if (!$workspace) {
            return response()->json(['has_active_subscription' => false]);
        }

        try {
            // 1. Verificar suscripción en Stripe (Cashier) vinculada al WORKSPACE
            $subscription = $workspace->subscriptions()
                ->where('type', 'default')
                ->where('stripe_status', 'active')
                ->first();

            // Verificar que el stripe_id sea válido (debe empezar con 'sub_')
            $hasActiveStripeSubscription = $subscription && str_starts_with($subscription->stripe_id, 'sub_');

            // 2. Obtener el plan del WORKSPACE (sistema personalizado)
            $workspacePlan = $workspace->getPlanName();
            $isWorkspacePaidPlan = in_array($workspacePlan, ['starter', 'professional', 'enterprise']);

            // 3. Verificar si el workspace tiene registro de suscripción manual activa
            $hasActiveManualSubscription = false;
            if ($workspace->subscription && $workspace->subscription->isActive()) {
                $hasActiveManualSubscription = true;
            }

            // El workspace tiene suscripción activa si tiene Stripe activo O plan manual de pago
            $hasActiveSubscription = $hasActiveStripeSubscription || $isWorkspacePaidPlan || $hasActiveManualSubscription;

            \Log::info('Checking active subscription (workspace-aware)', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
                'has_stripe' => $hasActiveStripeSubscription,
                'workspace_plan' => $workspacePlan,
                'is_paid_plan' => $isWorkspacePaidPlan,
                'has_manual' => $hasActiveManualSubscription,
                'result' => $hasActiveSubscription,
            ]);

            return response()->json([
                'has_active_subscription' => $hasActiveSubscription,
                'current_plan' => $workspacePlan,
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
            $limitKey = match ($metric) {
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
