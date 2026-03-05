<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Workspace\Workspace;

class DiagnoseSubscriptionSync extends Command
{
    protected $signature = 'subscription:diagnose-sync {--user-id= : ID del usuario a diagnosticar}';
    
    protected $description = 'Diagnostica la sincronización entre suscripciones de Stripe y planes locales';

    public function handle()
    {
        $userId = $this->option('user-id');

        if ($userId) {
            $this->diagnoseUser($userId);
        } else {
            $this->diagnoseAll();
        }
    }

    private function diagnoseUser($userId)
    {
        $user = User::find($userId);
        
        if (!$user) {
            $this->error("Usuario con ID {$userId} no encontrado");
            return;
        }

        $this->info("=== Diagnóstico para usuario: {$user->email} ===");
        $this->newLine();

        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
        
        if (!$workspace) {
            $this->warn("Usuario no tiene workspace");
            return;
        }

        // Plan actual del usuario
        $currentPlan = $user->current_plan ?? 'free';
        $this->info("Plan actual en BD: {$currentPlan}");

        // Verificar suscripción activa en historial
        $activeHistory = $user->subscriptionHistory()->active()->first();
        if ($activeHistory) {
            $this->info("Plan en historial activo: {$activeHistory->plan_name}");
        } else {
            $this->warn("No hay historial de suscripción activo");
        }

        // Verificar suscripción de Stripe
        $hasStripeSubscription = false;
        $subscription = null;
        
        try {
            $subscription = $workspace->subscriptions()
                ->where('type', 'default')
                ->where('stripe_status', 'active')
                ->first();
            
            // Verificar que el stripe_id sea válido
            if ($subscription && str_starts_with($subscription->stripe_id, 'sub_')) {
                $hasStripeSubscription = true;
            } else if ($subscription) {
                $this->warn("Suscripción encontrada pero con stripe_id inválido: {$subscription->stripe_id}");
                $this->warn("Los IDs de Stripe deben empezar con 'sub_'");
                $hasStripeSubscription = false;
            }
        } catch (\Exception $e) {
            $this->warn("Error al verificar suscripción: {$e->getMessage()}");
        }
        
        $this->info("¿Tiene suscripción activa en Stripe?: " . ($hasStripeSubscription ? 'SÍ' : 'NO'));

        if ($hasStripeSubscription) {
            $this->info("Stripe Subscription ID: {$subscription->stripe_id}");
            $this->info("Stripe Status: {$subscription->stripe_status}");
            $this->info("Stripe Price ID: {$subscription->stripe_price}");
            
            // Buscar a qué plan corresponde este price_id
            $plans = config('plans');
            $matchingPlan = null;
            foreach ($plans as $planKey => $planConfig) {
                if (isset($planConfig['stripe_price_id']) && $planConfig['stripe_price_id'] === $subscription->stripe_price) {
                    $matchingPlan = $planKey;
                    break;
                }
            }
            
            if ($matchingPlan) {
                $this->info("Plan correspondiente en Stripe: {$matchingPlan}");
                
                if ($matchingPlan !== $currentPlan) {
                    $this->error("⚠️  DESINCRONIZACIÓN DETECTADA");
                    $this->error("   Plan local: {$currentPlan}");
                    $this->error("   Plan en Stripe: {$matchingPlan}");
                    $this->newLine();
                    $this->info("Solución sugerida:");
                    $this->info("   El usuario puede ir a /pricing y seleccionar su plan '{$matchingPlan}'");
                    $this->info("   El sistema detectará la suscripción activa y hará el cambio sin cobrar");
                }
            } else {
                $this->warn("No se encontró plan local que coincida con el Stripe Price ID");
            }
        } else {
            if ($currentPlan !== 'free' && $currentPlan !== 'demo') {
                $this->error("⚠️  PROBLEMA: Usuario tiene plan de pago pero sin suscripción en Stripe");
            }
        }

        $this->newLine();
    }

    private function diagnoseAll()
    {
        $this->info("=== Diagnóstico general de suscripciones ===");
        $this->newLine();

        // Buscar usuarios con posible desincronización
        $users = User::whereNotIn('current_plan', ['free', 'demo'])
            ->orWhereHas('subscriptionHistory', function($query) {
                $query->where('is_active', true)
                      ->whereNotIn('plan_name', ['free', 'demo']);
            })
            ->get();

        $issues = 0;

        foreach ($users as $user) {
            $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
            
            if (!$workspace) {
                continue;
            }

            $currentPlan = $user->current_plan ?? 'free';
            $hasStripeSubscription = $workspace->subscribed('default');

            // Caso 1: Plan de pago pero sin suscripción en Stripe
            if (!in_array($currentPlan, ['free', 'demo']) && !$hasStripeSubscription) {
                $this->warn("Usuario {$user->email}: Plan '{$currentPlan}' sin suscripción en Stripe");
                $issues++;
            }

            // Caso 2: Suscripción en Stripe pero plan gratuito
            if (in_array($currentPlan, ['free', 'demo']) && $hasStripeSubscription) {
                $subscription = $workspace->subscription('default');
                $this->warn("Usuario {$user->email}: Plan '{$currentPlan}' pero tiene suscripción activa en Stripe (ID: {$subscription->stripe_id})");
                $issues++;
            }
        }

        $this->newLine();
        if ($issues === 0) {
            $this->info("✓ No se encontraron problemas de sincronización");
        } else {
            $this->error("Se encontraron {$issues} posibles problemas de sincronización");
        }
    }
}
