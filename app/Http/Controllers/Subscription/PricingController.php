<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PricingController extends Controller
{
    public function __construct(
        private \App\Services\PlanManagementService $planManagement
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $currentPlan = 'free';

        if ($user) {
            // Leer del campo current_plan del usuario
            $currentPlan = $user->current_plan ?? 'free';
        }

        // Obtener todos los planes de la configuración
        $plans = collect(config('plans'))->map(function ($plan, $key) {
            // Solo mostrar planes que:
            // 1. Son gratuitos (price = 0), O
            // 2. Tienen stripe_price_id configurado y válido
            $isFreePlan = $plan['price'] == 0;
            $hasValidStripeId = !empty($plan['stripe_price_id']) && 
                               $plan['stripe_price_id'] !== 'price_starter_monthly' &&
                               $plan['stripe_price_id'] !== 'price_professional_monthly' &&
                               $plan['stripe_price_id'] !== 'price_enterprise_monthly';
            
            // Si no es plan gratuito y no tiene Stripe ID válido, marcarlo como deshabilitado
            $enabled = ($plan['enabled'] ?? true) && ($isFreePlan || $hasValidStripeId);
            
            return [
                'id' => $key,
                'name' => $plan['name'],
                'price' => $plan['price'],
                'description' => $plan['description'] ?? '',
                'features' => $plan['features'] ?? [],
                'limits' => $plan['limits'],
                'popular' => $key === 'professional', // Marcar Professional como popular
                'enabled' => $enabled,
                'trial_days' => $plan['trial_days'] ?? null,
                'requires_stripe' => !$isFreePlan, // Indicar si requiere Stripe
            ];
        })->values()->toArray();

        return Inertia::render('Pricing/PricingPage', [
            'plans' => $plans,
            'currentPlan' => $currentPlan,
        ]);
    }

    /**
     * Manejar el éxito del pago de Stripe
     */
    public function success(Request $request)
    {
        $sessionId = $request->query('session_id');
        $planFromUrl = $request->query('plan');
        
        if (!$sessionId) {
            return redirect()->route('pricing.index')
                ->with('error', 'Sesión de pago no válida');
        }

        // Obtener información de la sesión de Stripe
        try {
            $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
            $session = $stripe->checkout->sessions->retrieve($sessionId);
            
            $user = $request->user();
            $planName = $session->metadata->plan ?? $planFromUrl ?? 'starter';
            
            // Usar el servicio centralizado para cambiar el plan
            $success = $this->planManagement->changePlan(
                user: $user,
                newPlan: $planName,
                stripePriceId: $session->metadata->stripe_price_id ?? null,
                stripeSubscriptionId: $session->subscription,
                stripeCustomerId: $session->customer,
                reason: 'stripe_payment_completed',
                metadata: [
                    'stripe_session_id' => $sessionId,
                    'amount_paid' => $session->amount_total / 100,
                    'currency' => $session->currency,
                ]
            );
            
            if (!$success) {
                throw new \Exception('Failed to update plan');
            }

            // Update onboarding state to mark plan as selected
            $onboardingState = $user->onboardingState;
            if ($onboardingState && !$onboardingState->plan_selected) {
                $onboardingState->update([
                    'plan_selected' => true,
                    'selected_plan' => $planName,
                ]);

                \Log::info('Onboarding state updated after Stripe payment success', [
                    'user_id' => $user->id,
                    'plan' => $planName,
                ]);
            }
            
            \Log::info('Subscription activated via Stripe checkout success page', [
                'user_id' => $user->id,
                'plan' => $planName,
                'session_id' => $sessionId,
            ]);
            
            return Inertia::render('Subscription/Success', [
                'plan' => $planName,
                'amount' => $session->amount_total / 100,
                'currency' => strtoupper($session->currency ?? 'usd'),
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error processing successful payment', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);
            
            return redirect()->route('dashboard')
                ->with('success', '¡Pago procesado exitosamente! Tu suscripción está activa.');
        }
    }

    /**
     * Manejar la cancelación del pago
     */
    public function cancel(Request $request)
    {
        return Inertia::render('Subscription/Cancel');
    }

    /**
     * Obtener todos los planes disponibles (API endpoint)
     */
    public function getPlans(Request $request)
    {
        // Obtener todos los planes de la configuración
        $plans = collect(config('plans'))->map(function ($plan, $key) {
            // Solo mostrar planes que:
            // 1. Son gratuitos (price = 0), O
            // 2. Tienen stripe_price_id configurado y válido
            $isFreePlan = $plan['price'] == 0;
            $hasValidStripeId = !empty($plan['stripe_price_id']) && 
                               $plan['stripe_price_id'] !== 'price_starter_monthly' &&
                               $plan['stripe_price_id'] !== 'price_professional_monthly' &&
                               $plan['stripe_price_id'] !== 'price_enterprise_monthly';
            
            // Si no es plan gratuito y no tiene Stripe ID válido, marcarlo como deshabilitado
            $enabled = ($plan['enabled'] ?? true) && ($isFreePlan || $hasValidStripeId);
            
            return [
                'id' => $key,
                'name' => $plan['name'],
                'price' => $plan['price'],
                'description' => $plan['description'] ?? '',
                'features' => $plan['features'] ?? [],
                'limits' => $plan['limits'],
                'popular' => $key === 'professional', // Marcar Professional como popular
                'enabled' => $enabled,
                'trial_days' => $plan['trial_days'] ?? null,
                'requires_stripe' => !$isFreePlan, // Indicar si requiere Stripe
            ];
        })->values()->toArray();

        return response()->json($plans);
    }
}
