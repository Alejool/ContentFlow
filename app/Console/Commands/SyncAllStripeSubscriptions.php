<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Services\SubscriptionTrackingService;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Subscription;

class SyncAllStripeSubscriptions extends Command
{
    protected $signature = 'stripe:sync-subscriptions {--workspace-id= : ID específico del workspace}';
    
    protected $description = 'Sincroniza todas las suscripciones activas con Stripe para verificar su estado';

    public function __construct(
        private SubscriptionTrackingService $subscriptionTracking
    ) {
        parent::__construct();
    }

    public function handle()
    {
        $this->info('Iniciando sincronización de suscripciones con Stripe...');
        $this->newLine();

        $workspaceId = $this->option('workspace-id');
        
        // Obtener workspaces con suscripciones activas
        $query = Workspace::whereHas('subscriptions', function ($q) {
            $q->where('stripe_status', 'active')
              ->orWhere('stripe_status', 'past_due');
        });

        if ($workspaceId) {
            $query->where('id', $workspaceId);
        }

        $workspaces = $query->get();

        if ($workspaces->isEmpty()) {
            $this->warn('No se encontraron workspaces con suscripciones activas');
            return 0;
        }

        $this->info("Encontrados {$workspaces->count()} workspaces con suscripciones activas");
        $this->newLine();

        $synced = 0;
        $errors = 0;

        foreach ($workspaces as $workspace) {
            try {
                $this->syncWorkspaceSubscription($workspace);
                $synced++;
            } catch (\Exception $e) {
                $errors++;
                $this->error("Error sincronizando workspace {$workspace->id}: {$e->getMessage()}");
                Log::error('Error syncing workspace subscription', [
                    'workspace_id' => $workspace->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->newLine();
        $this->info("Sincronización completada:");
        $this->info("  ✓ Sincronizados: {$synced}");
        if ($errors > 0) {
            $this->warn("  ✗ Errores: {$errors}");
        }

        return 0;
    }

    private function syncWorkspaceSubscription(Workspace $workspace): void
    {
        $subscription = $workspace->subscriptions()
            ->where('type', 'default')
            ->whereIn('stripe_status', ['active', 'past_due'])
            ->first();

        if (!$subscription) {
            return;
        }

        $this->line("Sincronizando workspace #{$workspace->id} ({$workspace->name})...");

        // Obtener información actualizada de Stripe
        try {
            $stripeSubscription = $subscription->asStripeSubscription();
        } catch (\Exception $e) {
            $this->warn("  No se pudo obtener información de Stripe: {$e->getMessage()}");
            return;
        }

        // Verificar si el estado cambió
        $currentStatus = $subscription->stripe_status;
        $stripeStatus = $stripeSubscription->status;

        if ($currentStatus !== $stripeStatus) {
            $this->warn("  Estado cambió: {$currentStatus} → {$stripeStatus}");
            
            $subscription->update([
                'stripe_status' => $stripeStatus,
            ]);

            // Si la suscripción fue cancelada o expiró, mover a plan free
            if (in_array($stripeStatus, ['canceled', 'unpaid', 'incomplete_expired'])) {
                $user = $workspace->owner();
                if ($user) {
                    $user->update(['current_plan' => 'free']);
                    
                    $this->subscriptionTracking->recordPlanChange(
                        user: $user,
                        newPlan: 'free',
                        previousPlan: $user->current_plan,
                        stripePriceId: null,
                        price: 0,
                        billingCycle: 'monthly',
                        reason: 'stripe_sync_subscription_expired'
                    );

                    $this->info("  Usuario movido a plan free");
                }
            }
        }

        // Verificar si el plan cambió
        $stripePriceId = $stripeSubscription->items->data[0]->price->id ?? null;
        
        if ($stripePriceId && $stripePriceId !== $subscription->stripe_price) {
            $this->warn("  Price ID cambió: {$subscription->stripe_price} → {$stripePriceId}");
            
            // Detectar el nuevo plan
            $newPlan = $this->getPlanFromPriceId($stripePriceId);
            
            if ($newPlan) {
                $subscription->update([
                    'stripe_price' => $stripePriceId,
                ]);

                $user = $workspace->owner();
                if ($user && $user->current_plan !== $newPlan) {
                    $previousPlan = $user->current_plan;
                    $user->update(['current_plan' => $newPlan]);
                    
                    $planConfig = config("plans.{$newPlan}");
                    
                    $this->subscriptionTracking->recordPlanChange(
                        user: $user,
                        newPlan: $newPlan,
                        previousPlan: $previousPlan,
                        stripePriceId: $stripePriceId,
                        price: $planConfig['price'] ?? 0,
                        billingCycle: 'monthly',
                        reason: 'stripe_sync_plan_changed'
                    );

                    $this->info("  Plan actualizado a: {$newPlan}");
                }
            }
        }

        $this->line("  ✓ Sincronizado");
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
