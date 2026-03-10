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
            'plan' => 'required|in:starter,growth,professional,enterprise',
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

        Log::info('Creating checkout session', [
            'plan_id' => $request->plan,
            'plan_config' => $plan,
            'stripe_price_id' => $plan['stripe_price_id'] ?? 'NOT SET',
        ]);

        if (!$plan || empty($plan['stripe_price_id'])) {
            Log::error('Invalid plan configuration', [
                'plan_id' => $request->plan,
                'plan_config' => $plan,
            ]);
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
            Log::error('Failed to create checkout session', [
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

        Log::info('Subscription created via Stripe', [
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
                    'status' => 'canceling',  // Usar 'canceling' para mantener acceso hasta el fin del período
                    'cancel_at_period_end' => true,
                    'ends_at' => $periodEnd,
                    'cancellation_reason' => $request->input('reason', 'user_requested'),
                ]);
            }

            Log::info('Subscription canceled at period end', [
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
            Log::error('Failed to cancel subscription', [
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

    public function activateFreePlan(Request $request): \Illuminate\Http\Response|\Illuminate\Http\JsonResponse|RedirectResponse
    {
        $request->validate([
            'plan' => 'required|in:free,demo',
        ]);

        $user = $request->user();
        $plan = $request->plan;
        $planConfig = config("plans.{$plan}");
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        // Verificar si el plan demo está habilitado
        if ($plan === 'demo' && !($planConfig['enabled'] ?? true)) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'El plan demo no está disponible en este momento.'], 403);
            }
            return back()->with('error', 'El plan demo no está disponible en este momento.');
        }

        // Bloquear cambio a Free / Demo si hay suscripción de pago activa
        if ($workspace) {
            $hasActiveStripeSubscription = $workspace->subscriptions()
                ->where('type', 'default')
                ->where('stripe_status', 'active')
                ->whereRaw("stripe_id LIKE 'sub_%'")
                ->exists();

            $hasActiveManualSubscription =
                $workspace->subscription &&
                $workspace->subscription->isActive() &&
                in_array($workspace->subscription->plan, ['starter', 'growth', 'professional', 'enterprise']);

            if ($hasActiveStripeSubscription || $hasActiveManualSubscription) {
                $message = "No puedes cambiar a un plan gratuito mientras tengas una suscripción de pago activa.\nPrimero debes cancelar tu suscripción actual.";

                if ($request->expectsJson()) {
                    return response()->json([
                        'error' => 'Active subscription exists',
                        'message' => $message,
                        'requires_cancellation' => true,
                        'current_plan' => $workspace->subscription->plan ?? 'unknown',
                        'can_cancel' => $workspace->isOwner($user),
                        'cancel_url' => route('subscription.cancel')
                    ], 403);
                }
                return back()->with('error', $message)
                            ->with('show_cancel_button', true);
            }
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

            if ($request->expectsJson()) {
                return response()->json(['success' => true, 'plan' => $plan]);
            }
            return back()->with('success', __('Plan activado exitosamente'));
        } catch (\Exception $e) {
            Log::error('Failed to activate free plan', [
                'user_id' => $user->id,
                'plan' => $plan,
                'error' => $e->getMessage()
            ]);

            if ($request->expectsJson()) {
                return response()->json(['error' => 'Error al activar el plan. Por favor, intenta de nuevo.'], 500);
            }
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
            'plan' => 'required|in:free,starter,growth,professional,enterprise',
        ]);

        $user = $request->user();
        $newPlan = $request->plan;
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if (!$workspace) {
            return response()->json(['error' => 'No workspace found'], 404);
        }

        // Get current plan - usar current_plan del usuario como fuente de verdad
        $previousPlan = $user->current_plan ?? 'free';
        
        // Fallback: si current_plan está vacío, buscar en subscription history
        if (!$previousPlan || $previousPlan === '') {
            $currentHistory = $user->subscriptionHistory()->active()->first();
            $previousPlan = $currentHistory?->plan_name ?? 'free';
        }
        
        Log::info('Starting plan change', [
            'user_id' => $user->id,
            'workspace_id' => $workspace->id,
            'previous_plan' => $previousPlan,
            'new_plan' => $newPlan,
            'user_current_plan' => $user->current_plan
        ]);

        try {
            // Get plan configuration
            $planConfig = config("plans.{$newPlan}");

            if (!$planConfig) {
                return response()->json(['error' => 'Invalid plan configuration'], 400);
            }

            // 1. PRIMERO: Verificar si ya tiene una suscripción activa para el plan solicitado
            // Esto permite cambiar entre planes ya comprados sin pasar por Stripe
            // Buscar en workspace (las suscripciones están asociadas al workspace, no al usuario directamente)
            $matchingSubscription = $workspace->subscriptions()
                ->where('stripe_status', 'active')
                ->where(function ($query) use ($newPlan, $planConfig) {
                    // Buscar por nombre de plan O por stripe_price_id
                    $query->where('plan', $newPlan)
                        ->orWhere('stripe_price', $planConfig['stripe_price_id']);
                })
                ->first();
            
            Log::info('Checking for matching subscription', [
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'new_plan' => $newPlan,
                'stripe_price_id' => $planConfig['stripe_price_id'],
                'found_matching' => $matchingSubscription ? true : false,
                'matching_subscription_id' => $matchingSubscription?->stripe_id,
                'matching_subscription_plan' => $matchingSubscription?->plan,
                'matching_subscription_price' => $matchingSubscription?->stripe_price,
            ]);

            if ($matchingSubscription) {
                Log::info('Switching to already active subscription', [
                    'workspace_id' => $workspace->id,
                    'plan' => $newPlan,
                    'subscription_id' => $matchingSubscription->stripe_id,
                    'user_id' => $user->id,
                    'previous_plan' => $previousPlan
                ]);

                // CRITICAL: Update user's current_plan
                $user->update(['current_plan' => $newPlan]);
                
                Log::info('User current_plan updated', [
                    'user_id' => $user->id,
                    'new_current_plan' => $user->fresh()->current_plan
                ]);
                
                // CRITICAL: Also update workspace subscription if exists
                if ($workspace->subscription) {
                    $workspace->subscription->update(['plan' => $newPlan]);
                    Log::info('Workspace subscription updated', [
                        'workspace_id' => $workspace->id,
                        'new_plan' => $workspace->subscription->fresh()->plan
                    ]);
                }

                // Record plan change
                $this->subscriptionTracking->recordPlanChange(
                    user: $user,
                    newPlan: $newPlan,
                    previousPlan: $previousPlan,
                    stripePriceId: $planConfig['stripe_price_id'] ?? null,
                    price: $planConfig['price'] ?? 0,
                    billingCycle: $planConfig['billing_cycle'] ?? 'monthly',
                    reason: 'switch_to_active_subscription'
                );
                
                // Invalidate cache
                cache()->forget("user_subscription_{$user->id}");
                cache()->forget("workspace_{$workspace->id}_limits");
                cache()->forget("workspace_{$workspace->id}_usage");
                
                // Clear usage cache for plan change
                $planLimitValidator = app(\App\Services\Subscription\PlanLimitValidator::class);
                $planLimitValidator->clearUsageCacheForPlanChange($workspace);
                
                // Notify via WebSocket about plan change
                $notificationService = app(\App\Services\Subscription\UsageLimitsNotificationService::class);
                $notificationService->notifyLimitsUpdated($workspace, 'plan_changed');
                
                Log::info('Plan change completed successfully', [
                    'user_id' => $user->id,
                    'workspace_id' => $workspace->id,
                    'new_plan' => $newPlan,
                    'user_current_plan_after' => $user->fresh()->current_plan
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Cambiado al plan ' . ucfirst($newPlan) . ' exitosamente.',
                    'plan' => $newPlan,
                    'is_switch' => true,
                    'requires_reload' => true
                ]);
            }

            // 2. Si no tiene una activa directa, buscar cualquier suscripción activa para SWAP
            $hasActiveStripeSubscription = false;
            $cashierSubscription = null;
            $hasAnyActiveSubscription = false; // Nueva variable para suscripciones manuales/demo
            
            try {
                // CRITICAL: Buscar suscripciones en el workspace
                // Las suscripciones están asociadas al workspace, no al usuario directamente
                $cashierSubscription = $workspace->subscriptions()
                    ->where('type', 'default')
                    ->where('stripe_status', 'active')
                    ->first();

                // Verificar si es una suscripción real de Stripe o manual/demo
                if ($cashierSubscription) {
                    $hasAnyActiveSubscription = true;
                    if (str_starts_with($cashierSubscription->stripe_id, 'sub_')) {
                        $hasActiveStripeSubscription = true;
                    } else {
                        // Es una suscripción manual/demo
                        $hasActiveStripeSubscription = false;
                    }
                } else {
                    $cashierSubscription = null;
                    $hasActiveStripeSubscription = false;
                    $hasAnyActiveSubscription = false;
                }

                Log::info('Checking subscription for plan swap', [
                    'user_id' => $user->id,
                    'workspace_id' => $workspace->id,
                    'new_plan' => $newPlan,
                    'has_active_stripe' => $hasActiveStripeSubscription,
                    'has_any_active' => $hasAnyActiveSubscription,
                    'subscription_id' => $cashierSubscription?->stripe_id,
                    'subscription_status' => $cashierSubscription?->stripe_status,
                ]);
            } catch (\Exception $e) {
                Log::warning('Error checking Stripe subscription for swap', [
                    'workspace_id' => $workspace->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            // SANDBOX MODE: Si no hay suscripciones reales de Stripe pero tiene suscripción activa (manual/demo),
            // permitir cambios entre planes sin verificar Stripe (útil para testing)
            $isSandboxMode = config('app.env') !== 'production';
            $hasPaidPlan = in_array($previousPlan, ['starter', 'growth', 'professional', 'enterprise']);
            
            // También verificar si tiene una suscripción manual activa
            $hasActiveManualSubscription =
                $workspace->subscription &&
                $workspace->subscription->isActive() &&
                in_array($workspace->subscription->plan, ['starter', 'growth', 'professional', 'enterprise']);
            
            if ($isSandboxMode && !$hasActiveStripeSubscription && ($hasPaidPlan || $hasActiveManualSubscription || $hasAnyActiveSubscription) && $newPlan !== 'free' && $newPlan !== 'demo') {
                Log::info('SANDBOX MODE: Allowing plan change without real Stripe subscription', [
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'previous_plan' => $previousPlan,
                    'new_plan' => $newPlan,
                    'has_manual_subscription' => $hasActiveManualSubscription,
                    'has_any_active_subscription' => $hasAnyActiveSubscription
                ]);
                
                // Actualizar plan directamente
                $user->update(['current_plan' => $newPlan]);
                
                if ($workspace->subscription) {
                    $workspace->subscription->update(['plan' => $newPlan]);
                }
                
                $this->subscriptionTracking->recordPlanChange(
                    user: $user,
                    newPlan: $newPlan,
                    previousPlan: $previousPlan,
                    stripePriceId: $planConfig['stripe_price_id'] ?? null,
                    price: $planConfig['price'] ?? 0,
                    billingCycle: $planConfig['billing_cycle'] ?? 'monthly',
                    reason: 'sandbox_mode_switch'
                );
                
                cache()->forget("user_subscription_{$user->id}");
                cache()->forget("workspace_{$workspace->id}_limits");
                cache()->forget("workspace_{$workspace->id}_usage");
                
                // Clear usage cache for plan change
                $planLimitValidator = app(\App\Services\Subscription\PlanLimitValidator::class);
                $planLimitValidator->clearUsageCacheForPlanChange($workspace);
                
                // Notify via WebSocket about plan change
                $notificationService = app(\App\Services\Subscription\UsageLimitsNotificationService::class);
                $notificationService->notifyLimitsUpdated($workspace, 'plan_changed');
                
                return response()->json([
                    'success' => true,
                    'message' => 'Plan actualizado (modo sandbox)',
                    'plan' => $newPlan,
                    'requires_reload' => true,
                    'is_sandbox' => true
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

            // SWAP: Para cambios entre planes de pago con suscripción activa de Stripe
            // Esto aplica prorrateo automático
            if ($hasActiveStripeSubscription && 
                $cashierSubscription &&
                $newPlan !== 'free' && 
                $newPlan !== 'demo') {
                
                // Verificar que el plan anterior también sea de pago (no free/demo)
                $isPreviousPlanPaid = in_array($previousPlan, ['starter', 'growth', 'professional', 'enterprise']);
                
                if ($isPreviousPlanPaid) {
                    try {
                        Log::info('Executing Stripe swap for paid-to-paid plan change', [
                            'workspace_id' => $workspace->id,
                            'user_id' => $user->id,
                            'previous_plan' => $previousPlan,
                            'new_plan' => $newPlan,
                            'stripe_price_id' => $planConfig['stripe_price_id'],
                            'subscription_id' => $cashierSubscription->stripe_id
                        ]);

                        // Usar Stripe swap API con prorrateo automático
                        $cashierSubscription->swap($planConfig['stripe_price_id']);
                        
                        // Actualizar inmediatamente el plan del usuario
                        $user->update(['current_plan' => $newPlan]);
                        
                        // Actualizar workspace subscription si existe
                        if ($workspace->subscription) {
                            $workspace->subscription->update(['plan' => $newPlan]);
                        }
                        
                        // Registrar cambio en el sistema de tracking
                        $this->subscriptionTracking->recordPlanChange(
                            user: $user,
                            newPlan: $newPlan,
                            previousPlan: $previousPlan,
                            stripePriceId: $planConfig['stripe_price_id'] ?? null,
                            price: $planConfig['price'] ?? 0,
                            billingCycle: $planConfig['billing_cycle'] ?? 'monthly',
                            reason: 'stripe_swap_with_proration'
                        );
                        
                        // Invalidate cache
                        cache()->forget("user_subscription_{$user->id}");
                        cache()->forget("workspace_{$workspace->id}_limits");
                        cache()->forget("workspace_{$workspace->id}_usage");
                        
                        // Clear usage cache for plan change
                        $planLimitValidator = app(\App\Services\Subscription\PlanLimitValidator::class);
                        $planLimitValidator->clearUsageCacheForPlanChange($workspace);
                        
                        // Notify via WebSocket about plan change
                        $notificationService = app(\App\Services\Subscription\UsageLimitsNotificationService::class);
                        $notificationService->notifyLimitsUpdated($workspace, 'plan_changed');
                        
                        Log::info('Stripe swap completed successfully', [
                            'workspace_id' => $workspace->id,
                            'user_id' => $user->id,
                            'new_plan' => $newPlan,
                            'user_current_plan_after' => $user->fresh()->current_plan
                        ]);
                        
                        // Invalidar caché de Inertia para forzar refresh
                        return response()->json([
                            'success' => true,
                            'message' => 'Plan actualizado con prorrateo automático',
                            'plan' => $newPlan,
                            'requires_reload' => true,
                            'is_swap' => true
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Failed to execute Stripe swap', [
                            'workspace_id' => $workspace->id,
                            'user_id' => $user->id,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                        
                        return response()->json([
                            'error' => 'Failed to swap plan',
                            'message' => 'No se pudo cambiar el plan. Por favor, intenta de nuevo.',
                        ], 500);
                    }
                }
            }

            // REMOVED: Ya no permitimos cambios entre planes de pago sin pasar por Stripe (excepto en modo sandbox)
            // Todos los cambios de planes de pago deben ir a Stripe Checkout en producción
            
            // Si llegamos aqui y requiere un pago por Stripe, obligar al checkout (para agregar una nueva subscripción)
            if ($newPlan !== 'free' && $newPlan !== 'demo' && isset($planConfig['stripe_price_id'])) {
                Log::info('Requiring Stripe checkout for plan change', [
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'current_plan' => $previousPlan,
                    'new_plan' => $newPlan,
                    'has_manual_subscription' => $hasActiveManualSubscription
                ]);
                
                return response()->json([
                    'error' => 'Payment required',
                    'message' => 'Complete su pago de forma segura a través de Stripe para usar este plan.',
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
            Log::error('Failed to change plan', [
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
            'growth' => 2.5,
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
            'growth' => 2.5,
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
            $isWorkspacePaidPlan = in_array($workspacePlan, ['starter', 'growth', 'professional', 'enterprise']);

            // 3. Verificar si el workspace tiene registro de suscripción manual activa
            $hasActiveManualSubscription = false;
            if ($workspace->subscription && $workspace->subscription->isActive()) {
                $hasActiveManualSubscription = true;
            }

            // El workspace tiene suscripción activa si tiene Stripe activo O plan manual de pago
            $hasActiveSubscription = $hasActiveStripeSubscription || $isWorkspacePaidPlan || $hasActiveManualSubscription;

            // 4. Obtener TODAS las suscripciones activas (para listar)
            $activeSubscriptions = $workspace->subscriptions()
                ->whereIn('stripe_status', ['active', 'trialing', 'past_due'])
                ->get();

            $activePlansDetail = $activeSubscriptions->map(function ($sub) {
                // Inferir plan si no está en la columna plan
                $planName = $sub->plan;
                if (!$planName) {
                    $plans = config('plans');
                    foreach ($plans as $key => $config) {
                        if (($config['stripe_price_id'] ?? null) === $sub->stripe_price) {
                            $planName = $key;
                            break;
                        }
                    }
                }

                return [
                    'id' => $sub->id,
                    'plan' => $planName,
                    'name' => config("plans.{$planName}.name", ucfirst($planName ?? 'unknown')),
                    'status' => $sub->stripe_status,
                    'ends_at' => $sub->ends_at ? $sub->ends_at->toIso8601String() : null,
                    'cancel_at_period_end' => (bool)$sub->cancel_at_period_end,
                ];
            })->toArray();

            // Si tiene plan manual de pago pero no está en Stripe, agregarlo
            if ($isWorkspacePaidPlan && empty(array_filter($activePlansDetail, fn($p) => $p['plan'] === $workspacePlan))) {
                $activePlansDetail[] = [
                    'id' => 'manual',
                    'plan' => $workspacePlan,
                    'name' => config("plans.{$workspacePlan}.name", ucfirst($workspacePlan)),
                    'status' => 'active',
                    'ends_at' => null,
                    'cancel_at_period_end' => false,
                ];
            }

            // IMPORTANTE: Obtener array de planes activos (todos los que tienen suscripción activa)
            $activePlansArray = array_unique(array_filter(array_column($activePlansDetail, 'plan')));

            // 5. Obtener planes CON TIEMPO DISPONIBLE (comprados y aún no expirados)
            // Estos son planes que el usuario compró y puede usar sin pagar nuevamente
            // Si hay múltiples registros del mismo plan, solo tomar el más reciente
            $plansWithTimeAvailable = $user->subscriptionHistory()
                ->where(function($query) {
                    $query->whereNull('ended_at') // Sin fecha de fin (tiempo ilimitado)
                          ->orWhere('ended_at', '>', now()); // O aún no ha expirado
                })
                ->whereNotIn('plan_name', ['free', 'demo']) // No incluir planes gratuitos
                ->orderBy('created_at', 'desc') // Más reciente primero
                ->get()
                ->unique('plan_name') // Solo un registro por plan (el más reciente)
                ->pluck('plan_name')
                ->toArray();

            // DEBUG: Log para ver qué hay en subscription_history
            $allHistory = $user->subscriptionHistory()->get(['plan_name', 'ended_at', 'is_active', 'started_at', 'created_at']);
            Log::info('Subscription History Debug', [
                'user_id' => $user->id,
                'all_history' => $allHistory->toArray(),
                'plans_with_time' => $plansWithTimeAvailable,
            ]);

            // 6. Obtener planes EXPIRADOS (tiempo de uso consumido)
            $expiredPlans = $user->subscriptionHistory()
                ->whereNotNull('ended_at') // Tiene fecha de fin
                ->where('ended_at', '<', now()) // Y ya expiró
                ->whereNotIn('plan_name', $plansWithTimeAvailable) // NO mostrar planes con tiempo disponible
                ->whereNotIn('plan_name', ['free', 'demo']) // No mostrar free/demo
                ->reorder()
                ->distinct()
                ->pluck('plan_name')
                ->toArray();


            // Determinar current_plan
            // Usamos el plan de Workspace por defecto, pero le damos prioridad
            // a la elección del usuario (importante cuando tiene múltiples checkouts)
            $currentPlan = $workspacePlan;
            if ($user->current_plan && in_array($user->current_plan, $activePlansArray)) {
                $currentPlan = $user->current_plan;
            } elseif (!empty($activePlansArray) && !in_array($workspacePlan, $activePlansArray)) {
                $currentPlan = $activePlansArray[0]; // Si el workspacePlan ya no está activo, usar el primero activo
            }

            Log::info('Checking active subscription (workspace-aware)', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
                'has_stripe' => $hasActiveStripeSubscription,
                'workspace_plan' => $workspacePlan,
                'user_current_plan' => $user->current_plan,
                'final_current_plan' => $currentPlan,
                'is_paid_plan' => $isWorkspacePaidPlan,
                'has_manual' => $hasActiveManualSubscription,
                'result' => $hasActiveSubscription,
                'active_plans_count' => count($activePlansDetail),
                'plans_with_time_available' => $plansWithTimeAvailable,
                'expired_plans_count' => count($expiredPlans),
            ]);

            return response()->json([
                'has_active_subscription' => $hasActiveSubscription,
                'current_plan' => $currentPlan,
                'active_plans' => $plansWithTimeAvailable, // Planes con tiempo disponible
                'active_subscriptions' => $activePlansDetail,
                'expired_plans' => $expiredPlans,
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking active subscription', [
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
