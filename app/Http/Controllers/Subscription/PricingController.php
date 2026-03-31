<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\SystemConfigService;
use App\Services\PlanFilterService;

class PricingController extends Controller
{
    public function __construct(
        private \App\Services\PlanManagementService $planManagement,
        private SystemConfigService $systemConfig,
        private \App\Services\PlanFilterService $planFilter
    ) {}

    /**
     * Obtener planes habilitados y formateados.
     * Filtra por enabled en config/plans.php Y por configuración del sistema
     * Y filtra límites/características según configuración del sistema
     */
    private function getEnabledPlans(): array
    {
        // Usar el servicio de configuración del sistema para obtener planes disponibles
        $availablePlans = $this->systemConfig->getAvailablePlans();

        // Debug: Log para ver qué planes están configurados
        \Log::info('Available plans from system config:', array_keys($availablePlans));

        $filtered = collect($availablePlans)
            ->map(function ($plan, $key) {
                $isFreePlan = $plan['price'] == 0;

                // Filtrar límites y características según configuración del sistema
                $filteredPlan = $this->planFilter->filterPlan($plan);

                return [
                    'id' => $key,
                    'name' => $filteredPlan['name'],
                    'price' => $filteredPlan['price'],
                    'description' => $filteredPlan['description'] ?? '',
                    'features' => $filteredPlan['features'] ?? [],
                    'limits' => $filteredPlan['limits'],
                    'popular' => $filteredPlan['popular'] ?? ($key === 'professional'),
                    'enabled' => true, // Ya filtrados por SystemConfigService
                    'trial_days' => $filteredPlan['trial_days'] ?? null,
                    'requires_stripe' => !$isFreePlan,
                ];
            })
            ->values()
            ->toArray();

        \Log::info('Filtered plans:', array_column($filtered, 'id'));

        return $filtered;
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $currentPlan = 'demo';

        if ($user) {
            // Obtener el workspace actual
            $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

            if ($workspace) {
                // PRIORIZAR el plan del workspace actual
                $currentPlan = $workspace->getPlanName();

                \Log::info('Pricing page loaded for workspace', [
                    'user_id' => $user->id,
                    'workspace_id' => $workspace->id,
                    'current_plan' => $currentPlan,
                ]);
            } else {
                // Fallback si no hay workspace (poco probable si está autenticado)
                $activeHistory = $user->subscriptionHistory()->active()->first();
                $currentPlan = $activeHistory ? $activeHistory->plan_name : ($user->current_plan ?? 'demo');
            }
        }

        return Inertia::render('Pricing/PricingPage', [
            'plans' => $this->getEnabledPlans(),
            'currentPlan' => $currentPlan,
            'systemFeatures' => [
                'ai' => \App\Models\SystemSetting::isFeatureEnabled('ai'),
                'analytics' => \App\Models\SystemSetting::isFeatureEnabled('analytics'),
                'reels' => \App\Models\SystemSetting::isFeatureEnabled('reels'),
                'approval_workflows' => \App\Models\SystemSetting::isFeatureEnabled('approval_workflows'),
                'calendar_sync' => \App\Models\SystemSetting::isFeatureEnabled('calendar_sync'),
                'bulk_operations' => \App\Models\SystemSetting::isFeatureEnabled('bulk_operations'),
                'white_label' => \App\Models\SystemSetting::isFeatureEnabled('white_label'),
            ],
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
        return response()->json($this->getEnabledPlans());
    }
}
