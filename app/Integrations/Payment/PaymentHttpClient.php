<?php

namespace App\Integrations\Payment;

use Illuminate\Support\Facades\Http;

/**
 * Shared HTTP transport for payment gateway REST APIs (Wompi, PayU, MercadoPago).
 * Pure transport — gateway-specific payload/response logic stays in the gateways.
 */
class PaymentHttpClient
{
    /**
     * @return array{successful: bool, status: int, json: array, body: string}
     */
    public function post(string $url, array $headers, array $body): array
    {
        return $this->normalize(Http::withHeaders($headers)->post($url, $body));
    }

    /**
     * @return array{successful: bool, status: int, json: array, body: string}
     */
    public function get(string $url, array $headers = []): array
    {
        return $this->normalize(Http::withHeaders($headers)->get($url));
    }

    private function normalize($response): array
    {
        return [
            'successful' => $response->successful(),
            'status' => $response->status(),
            'json' => $response->json() ?? [],
            'body' => $response->body(),
        ];
    }
}
