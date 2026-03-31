<?php

namespace App\Services\Payment;

use App\Models\User;
use App\Models\Workspace\Workspace;

/**
 * Interfaz común para todas las pasarelas de pago
 */
interface PaymentGatewayInterface
{
    /**
     * Crear sesión de checkout para suscripción
     */
    public function createSubscriptionCheckout(
        Workspace $workspace,
        User $user,
        string $plan,
        array $metadata = []
    ): array;

    /**
     * Crear sesión de checkout para addon (pago único)
     */
    public function createAddonCheckout(
        Workspace $workspace,
        User $user,
        array $addonData,
        array $metadata = []
    ): array;

    /**
     * Cancelar suscripción
     */
    public function cancelSubscription(string $subscriptionId): bool;

    /**
     * Reanudar suscripción cancelada
     */
    public function resumeSubscription(string $subscriptionId): bool;

    /**
     * Cambiar plan (swap con prorrateo)
     */
    public function swapSubscription(string $subscriptionId, string $newPriceId): bool;

    /**
     * Obtener información de suscripción
     */
    public function getSubscription(string $subscriptionId): ?array;

    /**
     * Verificar webhook signature
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool;

    /**
     * Procesar evento de webhook
     */
    public function processWebhookEvent(array $event): void;

    /**
     * Obtener nombre del gateway
     */
    public function getName(): string;

    /**
     * Verificar si el gateway está disponible
     */
    public function isAvailable(): bool;
}
