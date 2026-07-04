<?php

namespace App\Integrations\Payment;

use Illuminate\Support\Facades\Http;

/**
 * HTTP client for exchangerate-api.com v6.
 * Pure transport — no caching, no fallback logic.
 */
class ExchangeRateApiClient
{
    /**
     * USD conversion rates map (currency => rate), or null on failure/missing key.
     */
    public function latestUsdRates(): ?array
    {
        $apiKey = env('EXCHANGE_RATE_API_KEY');

        if (!$apiKey) {
            return null;
        }

        $response = Http::timeout(5)->get("https://v6.exchangerate-api.com/v6/{$apiKey}/latest/USD");

        if (!$response->successful()) {
            return null;
        }

        return $response->json('conversion_rates');
    }
}
