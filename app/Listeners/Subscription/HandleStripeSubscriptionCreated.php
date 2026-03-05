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
        // Solo procesar eventos de suscripción creada o actualizada
        if (!in_array($event->payload['type'], [
            'customer.subscription.created',
            'customer.subscription.updated',
            'checkout.session.completed'
        ])) {
            return;
        }

        try {
            if ($event->payload['type'] === 'checkout.session.completed') {
                $this->handleCheckoutCompleted($event->payload);
            } elseif (in_array($event->payload['type'], ['customer.subscription.created', 'customer.subscription.updated'])) {
                $this->handleSubscriptionChange($event->payload);
            }
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
}
