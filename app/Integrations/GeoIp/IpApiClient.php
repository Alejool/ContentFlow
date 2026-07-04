<?php

namespace App\Integrations\GeoIp;

use Illuminate\Support\Facades\Http;

/**
 * HTTP client for ipapi.co (free tier: 1000 req/day).
 * Pure transport — no caching, no business rules.
 */
class IpApiClient
{
    /**
     * Raw geolocation payload for an IP, or null on HTTP failure.
     */
    public function lookup(string $ip): ?array
    {
        $response = Http::timeout(5)->get("https://ipapi.co/{$ip}/json/");

        if (!$response->successful()) {
            return null;
        }

        return $response->json();
    }

    /**
     * Two-letter country code for an IP, or null when unavailable.
     */
    public function lookupCountry(string $ip): ?string
    {
        $response = Http::timeout(5)->get("https://ipapi.co/{$ip}/country/");

        if (!$response->successful()) {
            return null;
        }

        $country = trim($response->body());

        return strlen($country) === 2 ? strtoupper($country) : null;
    }
}
