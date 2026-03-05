<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Workspace\Workspace;

class SyncStripeSubscription extends Command
{
    protected $signature = 'subscription:sync {--user-id= : ID del usuario} {--force : Forzar sincronización sin confirmación}';
    
    protected $description = 'Sincroniza la suscripción local con Stripe y actualiza el plan del usuario';

    public function __construct(
        private \App\Services\SubscriptionTrackingService $subscriptionTracking
    ) {
        parent::__construct();
    }

    public function handle()
    {
        $userId = $this->option('user-id');

        if (!$userId) {
            $this->error('Debes proporcionar el ID del usuario con --user-id');
            return 1;
        }

        $user = User::find($userId);
        
        if (!$user) {
            $this->error("Usuario con ID {$userId} no encontrado");
            return 1;
        }

        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
        
        if (!$workspace) {
            $this->error("Usuario no tiene workspace");
            return 1;
        }

        $this->info("Sincronizando suscripción para: {$user->email}");
        $this->newLine();

        // Buscar suscripción activa en Stripe
        $subscription = $workspace->subscriptions()
            ->where('type', 'default')
            ->where('stripe_status', 'active')
            ->first();

        if (!$subscription) {
            $this->warn("No se encontró suscripción activa en Stripe");
            return 1;
        }

        $this->info("Suscripción encontrada:");
        $this->info("  Stripe ID: {$subscription->stripe_id}");
        $this->info("  Status: {$subscription->stripe_status}");
        $this->info("  Price ID actual: " . ($subscription->stripe_price ?: '(vacío)'));
        $this->newLine();

        // Detectar el plan basado en el stripe_id
        $detectedPlan = null;
        if (str_contains($subscription->stripe_id, 'professional')) {
            $detectedPlan = 'professional';
        } elseif (str_contains($subscription->stripe_id, 'starter')) {
            $detectedPlan = 'starter';
        } elseif (str_contains($subscription->stripe_id, 'enterprise')) {
            $detectedPlan = 'enterprise';
        }

        if (!$detectedPlan) {
            $this->error("No se pudo detectar el plan desde el stripe_id");
            return 1;
        }

        $this->info("Plan detectado: {$detectedPlan}");
        
        // Obtener configuración del plan
        $planConfig = config("plans.{$detectedPlan}");
        
        if (!$planConfig) {
            $this->error("Configuración del plan no encontrada");
            return 1;
        }

        $stripePriceId = $planConfig['stripe_price_id'];
        $this->info("Stripe Price ID del plan: " . ($stripePriceId ?: '(no configurado)'));
        $this->newLine();

        if ($this->option('force') || $this->confirm('¿Deseas sincronizar esta suscripción?', true)) {
            // Actualizar stripe_price si está configurado
            if ($stripePriceId) {
                $subscription->update([
                    'stripe_price' => $stripePriceId
                ]);
                $this->info("✓ Stripe Price ID actualizado en la suscripción");
            }

            // Actualizar plan del usuario
            $previousPlan = $user->current_plan ?? 'free';
            
            // Actualizar el campo current_plan del usuario
            $user->update(['current_plan' => $detectedPlan]);
            $this->info("✓ Campo current_plan del usuario actualizado");
            
            $this->subscriptionTracking->recordPlanChange(
                user: $user,
                newPlan: $detectedPlan,
                previousPlan: $previousPlan,
                stripePriceId: $stripePriceId,
                price: $planConfig['price'] ?? 0,
                billingCycle: 'monthly',
                reason: 'manual_sync'
            );

            $this->info("✓ Historial de suscripción actualizado");
            $this->newLine();
            $this->info("Sincronización completada exitosamente!");
            
            return 0;
        }

        $this->info("Sincronización cancelada");
        return 0;
    }
}
