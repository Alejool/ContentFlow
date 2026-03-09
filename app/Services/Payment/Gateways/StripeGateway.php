<?php

namespace App\Services\Payment\Gateways;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class StripeGateway implements PaymentGatewayInterface
{
    private StripeClient $stripe;
    private string $webhookSecret;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('services.stripe.secret'));
        $this->webhookSecret = config('services.stripe.webhook_secret', '');
    }

    public function createSubscriptionCheckout(
        Workspace $workspace,
        User $user,
        string $plan,
        array $metadata = []
    ): array {
        $planConfig = config("plans.{$plan}");

        if (!$planConfig || empty($planConfig['stripe_price_id'])) {
            throw new \Exception('Invalid plan configuration');
        }

        $checkout = $workspace
            ->newSubscription('default', $planConfig['stripe_price_id'])
            ->checkout([
                'success_url' => url('/subscription/success') . '?session_id={CHECKOUT_SESSION_ID}&plan=' . $plan,
                'cancel_url' => url('/subscription/cancel'),
                'metadata' => array_merge([
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'plan' => $plan,
                    'gateway' => 'stripe',
                ], $metadata),
            ]);

        return [
            'url' => $checkout->url,
            'session_id' => $checkout->id,
            'gateway' => 'stripe',
        ];
    }

    public function createAddonCheckout(
        Workspace $workspace,
        User $user,
        array $addonData,
        array $metadata = []
    ): array {
        // Verificar si tiene stripe_price_id configurado
        if (!empty($addonData['stripe_price_id'])) {
            // Usar Checkout Session con el Price ID configurado
            $session = $this->stripe->checkout->sessions->create([
                'mode' => 'payment',
                'line_items' => [[
                    'price' => $addonData['stripe_price_id'],
                    'quantity' => $metadata['quantity'] ?? 1,
                ]],
                'success_url' => url('/subscription/addons') . '?success=true&session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => url('/subscription/addons') . '?canceled=true',
                'customer_email' => $user->email,
                'metadata' => array_merge([
                    'addon_sku' => $addonData['sku'],
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'addon_name' => $addonData['name'],
                    'addon_amount' => $addonData['amount'],
                    'addon_type' => $this->getAddonType($addonData['sku']),
                    'gateway' => 'stripe',
                ], $metadata),
            ]);

            return [
                'url' => $session->url,
                'session_id' => $session->id,
                'gateway' => 'stripe',
            ];
        }

        // Fallback: crear Payment Intent si no hay Price ID
        $paymentIntent = $this->stripe->paymentIntents->create([
            'amount' => $addonData['price'] * 100,
            'currency' => $addonData['currency'] ?? 'usd',
            'metadata' => array_merge([
                'addon_sku' => $addonData['sku'],
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'addon_name' => $addonData['name'],
                'addon_amount' => $addonData['amount'],
                'addon_type' => $this->getAddonType($addonData['sku']),
                'gateway' => 'stripe',
            ], $metadata),
            'description' => "Addon: {$addonData['name']} - {$addonData['amount']} {$addonData['unit']}",
        ]);

        return [
            'client_secret' => $paymentIntent->client_secret,
            'payment_intent_id' => $paymentIntent->id,
            'gateway' => 'stripe',
        ];
    }

    /**
     * Determinar el tipo de addon basado en el SKU
     */
    private function getAddonType(string $sku): string
    {
        if (str_starts_with($sku, 'ai_')) {
            return 'ai_credits';
        } elseif (str_starts_with($sku, 'storage_')) {
            return 'storage';
        } elseif (str_starts_with($sku, 'posts_')) {
            return 'publications';
        } elseif (str_starts_with($sku, 'members_')) {
            return 'team_members';
        }
        
        return 'unknown';
    }

    public function cancelSubscription(string $subscriptionId): bool
    {
        try {
            $this->stripe->subscriptions->update($subscriptionId, [
                'cancel_at_period_end' => true,
            ]);
            return true;
        } catch (\Exception $e) {
            Log::error('Stripe: Failed to cancel subscription', [
                'subscription_id' => $subscriptionId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function resumeSubscription(string $subscriptionId): bool
    {
        try {
            $this->stripe->subscriptions->update($subscriptionId, [
                'cancel_at_period_end' => false,
            ]);
            return true;
        } catch (\Exception $e) {
            Log::error('Stripe: Failed to resume subscription', [
                'subscription_id' => $subscriptionId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function swapSubscription(string $subscriptionId, string $newPriceId): bool
    {
        try {
            $subscription = $this->stripe->subscriptions->retrieve($subscriptionId);
            
            $this->stripe->subscriptions->update($subscriptionId, [
                'items' => [
                    [
                        'id' => $subscription->items->data[0]->id,
                        'price' => $newPriceId,
                    ],
                ],
                'proration_behavior' => 'always_invoice',
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Stripe: Failed to swap subscription', [
                'subscription_id' => $subscriptionId,
                'new_price_id' => $newPriceId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function getSubscription(string $subscriptionId): ?array
    {
        try {
            $subscription = $this->stripe->subscriptions->retrieve($subscriptionId);
            
            return [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'current_period_end' => $subscription->current_period_end,
                'cancel_at_period_end' => $subscription->cancel_at_period_end,
                'price_id' => $subscription->items->data[0]->price->id ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('Stripe: Failed to get subscription', [
                'subscription_id' => $subscriptionId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        try {
            Webhook::constructEvent($payload, $signature, $this->webhookSecret);
            return true;
        } catch (SignatureVerificationException $e) {
            Log::error('Stripe: Invalid webhook signature', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function processWebhookEvent(array $event): void
    {
        // La lógica de procesamiento de webhooks se mantiene en el controlador existente
        // Este método es un placeholder para futura refactorización
        Log::info('Stripe: Webhook event received', [
            'type' => $event['type'] ?? 'unknown',
        ]);
    }

    public function getName(): string
    {
        return 'stripe';
    }

    public function isAvailable(): bool
    {
        $secret = config('services.stripe.secret');
        $public = config('services.stripe.public') ?? config('services.stripe.key');
        
        return !empty($secret) && !empty($public);
    }
}
