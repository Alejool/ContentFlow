<?php

namespace App\Integrations\Webhooks;

use Illuminate\Support\Facades\Http;

/**
 * Generic outbound webhook transport (Discord, Slack, Telegram, Teams, custom).
 * Pure transport — message shaping stays in the dispatcher.
 */
class WebhookClient
{
    /**
     * POST a JSON payload to a webhook URL.
     *
     * @return array{http_status: int}
     */
    public function post(string $url, array $payload, array $headers = []): array
    {
        $request = Http::withHeaders($headers ?: ['Content-Type' => 'application/json']);
        $response = $request->post($url, $payload);

        return ['http_status' => $response->status()];
    }
}
