<?php

namespace App\Integrations\Contracts;

use Illuminate\Http\Request;

interface WebhookHandlerInterface
{
    /**
     * Verify the webhook signature
     */
    public function verifySignature(Request $request): bool;

    /**
     * Handle the incoming webhook
     */
    public function handle(Request $request): void;

    /**
     * Get supported webhook events
     */
    public function getSupportedEvents(): array;
}
