<?php

namespace App\Integrations\AI;

use Illuminate\Support\Facades\Http;

/**
 * HTTP transport for LLM provider REST APIs (DeepSeek, Gemini, OpenAI, Anthropic).
 * Pure transport — payload building and response parsing stay in the service.
 */
class LlmApiClient
{
    /**
     * POST a JSON payload and return a normalized result.
     *
     * @return array{successful: bool, status: int, json: array, body: string}
     */
    public function postJson(string $url, array $headers, array $payload, int $timeout = 60): array
    {
        $response = Http::withoutVerifying()
            ->withHeaders($headers)
            ->timeout($timeout)
            ->post($url, $payload);

        return [
            'successful' => $response->successful(),
            'status' => $response->status(),
            'json' => $response->json() ?? [],
            'body' => $response->body(),
        ];
    }
}
