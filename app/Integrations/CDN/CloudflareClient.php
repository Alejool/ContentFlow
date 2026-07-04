<?php

namespace App\Integrations\CDN;

use Illuminate\Support\Facades\Http;

/**
 * HTTP client for the Cloudflare zone API.
 * Pure transport — cache-purge orchestration stays in CDNService.
 */
class CloudflareClient
{
    /**
     * Purge specific file URLs from the Cloudflare cache.
     *
     * @return array{successful: bool, body: string}
     */
    public function purgeFiles(array $urls): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('cdn.cloudflare_api_token'),
            'Content-Type' => 'application/json',
        ])->post(
            'https://api.cloudflare.com/client/v4/zones/' . config('cdn.cloudflare_zone_id') . '/purge_cache',
            ['files' => $urls]
        );

        return [
            'successful' => $response->successful(),
            'body' => $response->body(),
        ];
    }
}
