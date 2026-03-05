<?php

namespace App\Listeners\Subscription;

use Laravel\Cashier\Events\WebhookReceived;
use App\Services\SubscriptionTrackingService;
use Illuminate\Support\Facades\Log;

class HandleStripeSubscriptionCreated
{
    public function __construct(
        private SubscriptionTrackingService $trackingService
    ) {}

    public function handle(WebhookReceived $event): void
    {
        // Eventos que procesamos
        $supportedEvents = [
            'customer.subscription.created',
            'customer.subscription.updated',
            'customer.subscription.deleted',
            'checkout.session.completed',
            'invoice.payment_failed',
            'invoice.payment_succeeded',
        ];

        if (!in_array($event->payload['type'], $supportedEvents)) {
            return;
        }

        try {
            match($event->payload['type']) {
                'checkout.session.completed' => $this->handleCheckoutCompleted($event->payload),
                'customer.subscription.created', 
                'customer.subscription.updated' => $this->handleSubscriptionChange($event->payload),
                'customer.subscription.deleted' => $this->handleSubscriptionDeleted($event->payload),
                'invoice.payment_failed' => $this->handlePaymentFailed($event->payload),
                'invoice.payment_succeeded' => $this->handlePaymentSucceeded($event->payload),
                default => null,
            };
        } catch (\Exception $e) {
            Log::error('Error handling Stripe webhook', [
                'event_type' => $event->payload['type'],
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    private function handleCheckoutCompleted(array $payload): void
    {
        $session = $payload['data']['object'];
        $metadata = $session['metadata'] ?? [];
        
        $userId = $metadata['user_id'] ?? null;
        $workspaceId = $metadata['workspace_id'] ?? null;
        $plan = $metadata['plan'] ?? null;

        if (!$userId || !$plan) {
            Log::warning('Missing metadata in checkout session', [
                'session_id' => $session['id'],
                'metadata' => $metadata,
            ]);
            return;
        }

        $user = \App\Models\User::find($userId);
        
        if (!$user) {
            Log::error('User not found for checkout session', ['user_id' => $userId]);
            return;
        }

        // Get current plan
        $currentHistory = $user->subscriptionHistory()->active()->first();
        $previousPlan = $currentHistory?->plan_name;

        // Get plan configuration
        $planConfig = config("plans.{$plan}");

        // Record plan change in tracking system
        $this->trackingService->recordPlanChange(
            user: $user,
            newPlan: $plan,
            previousPlan: $previousPlan,
            stripePriceId: $session['subscription'] ?? null,
            price: $planConfig['price'] ?? 0,
            billingCycle: 'monthly',
            reason: 'stripe_checkout_completed',
            metadata: [
                'stripe_session_id' => $session['id'],
                'stripe_customer_id' => $session['customer'] ?? null,
                'workspace_id' => $workspaceId,
            ]
        );

        // Update onboarding state to mark plan as selected
        $onboardingState = $user->onboardingState;
        if ($onboardingState && !$onboardingState->plan_selected) {
            $onboardingState->update([
                'plan_selected' => true,
                'selected_plan' => $plan,
            ]);

            Log::info('Onboarding state updated after Stripe checkout', [
                'user_id' => $userId,
                'plan' => $plan,
            ]);
        }

        Log::info('Subscription activated via Stripe checkout', [
            'user_id' => $userId,
            'plan' => $plan,
            'session_id' => $session['id'],
        ]);
    }

    private function handleSubscriptionChange(array $payload): void
    {
        $subscription = $payload['data']['object'];
        $metadata = $subscription['metadata'] ?? [];
        
        $userId = $metadata['user_id'] ?? null;
        $workspaceId = $metadata['workspace_id'] ?? null;
        $plan = $metadata['plan'] ?? null;

        if (!$userId || !$plan) {
            // Try to find user by Stripe customer ID
            $customerId = $subscription['customer'] ?? null;
            
            if (!$customerId) {
                return;
            }

            // Find workspace by Stripe customer ID
            $workspace = \App\Models\Workspace\Workspace::where('stripe_id', $customerId)->first();
            
            if (!$workspace) {
                return;
            }

            $user = $workspace->owner();
            
            if (!$user) {
                return;
            }

            // Try to determine plan from price ID
            $priceId = $subscription['items']['data'][0]['price']['id'] ?? null;
            $plan = $this->getPlanFromPriceId($priceId);
            
            if (!$plan) {
                return;
            }
        } else {
            $user = \App\Models\User::find($userId);
            
            if (!$user) {
                return;
            }
        }

        // Get current plan
        $currentHistory = $user->subscriptionHistory()->active()->first();
        $previousPlan = $currentHistory?->plan_name;

        // Only update if plan is different
        if ($previousPlan === $plan && $payload['type'] !== 'customer.subscription.created') {
            return;
        }

        // Get plan configuration
        $planConfig = config("plans.{$plan}");

        // Record plan change
        $this->trackingService->recordPlanChange(
            user: $user,
            newPlan: $plan,
            previousPlan: $previousPlan,
            stripePriceId: $subscription['items']['data'][0]['price']['id'] ?? null,
            price: $planConfig['price'] ?? 0,
            billingCycle: 'monthly',
            reason: $payload['type'] === 'customer.subscription.created' ? 'stripe_subscription_created' : 'stripe_subscription_updated',
            metadata: [
                'stripe_subscription_id' => $subscription['id'],
                'stripe_customer_id' => $subscription['customer'] ?? null,
                'workspace_id' => $workspaceId,
            ]
        );

        Log::info('Subscription updated via Stripe webhook', [
            'user_id' => $user->id,
            'plan' => $plan,
            'event_type' => $payload['type'],
        ]);
    }

    private function getPlanFromPriceId(?string $priceId): ?string
    {
        if (!$priceId) {
            return null;
        }

        $plans = config('plans');
        
        foreach ($plans as $planKey => $planConfig) {
            if (($planConfig['stripe_price_id'] ?? null) === $priceId) {
                return $planKey;
            }
        }

        return null;
    }

    /**
     * Manejar cuando una suscripción expira o es eliminada.
     */
    private function handleSubscriptionDeleted(array $payload): void
    {
        $subscription = $payload['data']['object'];
        $customerId = $subscription['customer'] ?? null;
        
        if (!$customerId) {
            return;
        }

        // Encontrar workspace por Stripe customer ID
        $workspace = \App\Models\Workspace\Workspace::where('stripe_id', $customerId)->first();
        
        if (!$workspace) {
            Log::warning('Workspace not found for subscription deletion', [
                'stripe_customer_id' => $customerId,
            ]);
            return;
        }

        $user = $workspace->owner();
        
        if (!$user) {
            Log::error('Owner not found for workspace', [
                'workspace_id' => $workspace->id,
            ]);
            return;
        }

        // Cambiar a plan free
        $planManagement = app(\App\Services\PlanManagementService::class);
        $planManagement->changePlan(
            user: $user,
            newPlan: 'free',
            reason: 'subscription_expired',
            metadata: [
                'stripe_subscription_id' => $subscription['id'],
                'expired_at' => now()->toDateTimeString(),
            ]
        );

        // Actualizar subscription en DB
        $workspaceSubscription = $workspace->subscription;
        if ($workspaceSubscription) {
            $workspaceSubscription->update([
                'status' => 'expired',
                'plan' => 'free',
                'stripe_status' => 'canceled',
                'ends_at' => now(),
            ]);
        }

        Log::info('Subscription expired, moved to free plan', [
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'stripe_subscription_id' => $subscription['id'],
        ]);
    }

    /**
     * Manejar cuando falla un pago - iniciar período de gracia.
     */
    private function handlePaymentFailed(array $payload): void
    {
        $invoice = $payload['data']['object'];
        $customerId = $invoice['customer'] ?? null;
        
        if (!$customerId) {
            return;
        }

        $workspace = \App\Models\Workspace\Workspace::where('stripe_id', $customerId)->first();
        
        if (!$workspace) {
            return;
        }

        $subscription = $workspace->subscription;
        
        if (!$subscription) {
            return;
        }

        // Iniciar período de gracia de 7 días
        $gracePeriodEnd = now()->addDays(7);
        
        $subscription->update([
            'status' => 'past_due',
            'stripe_status' => 'past_due',
            'grace_period_ends_at' => $gracePeriodEnd,
        ]);

        Log::warning('Payment failed, grace period started', [
            'workspace_id' => $workspace->id,
            'subscription_id' => $subscription->id,
            'grace_period_ends' => $gracePeriodEnd->toDateTimeString(),
            'invoice_id' => $invoice['id'],
        ]);

        // TODO: Enviar notificación al usuario sobre el pago fallido
    }

    /**
     * Manejar cuando un pago es exitoso - limpiar período de gracia.
     */
    private function handlePaymentSucceeded(array $payload): void
    {
        $invoice = $payload['data']['object'];
        $customerId = $invoice['customer'] ?? null;
        
        if (!$customerId) {
            return;
        }

        $workspace = \App\Models\Workspace\Workspace::where('stripe_id', $customerId)->first();
        
        if (!$workspace) {
            return;
        }

        $subscription = $workspace->subscription;
        
        if (!$subscription) {
            return;
        }

        // Si estaba en período de gracia, reactivar
        if ($subscription->status === 'past_due' && $subscription->grace_period_ends_at) {
            $subscription->update([
                'status' => 'active',
                'stripe_status' => 'active',
                'grace_period_ends_at' => null,
            ]);

            Log::info('Payment succeeded, subscription reactivated', [
                'workspace_id' => $workspace->id,
                'subscription_id' => $subscription->id,
                'invoice_id' => $invoice['id'],
            ]);
        }
    }
}
