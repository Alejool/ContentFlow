<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TestMercadoPagoConnection extends Command
{
    protected $signature = 'mercadopago:test';
    protected $description = 'Test MercadoPago API connection and credentials';

    public function handle()
    {
        $this->info('Testing MercadoPago API connection...');
        $this->newLine();

        $accessToken = config('services.mercadopago.access_token');
        $apiUrl = config('services.mercadopago.api_url', 'https://api.mercadopago.com');

        if (empty($accessToken)) {
            $this->error('❌ MERCADOPAGO_ACCESS_TOKEN is not configured');
            return 1;
        }

        $this->info("✓ Access Token configured (length: " . strlen($accessToken) . ")");
        $this->info("✓ API URL: {$apiUrl}");
        $this->newLine();

        // Test 1: Get user info
        $this->info('Test 1: Getting user info...');
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
            ])->get("{$apiUrl}/users/me");

            if ($response->successful()) {
                $user = $response->json();
                $this->info("✓ User ID: {$user['id']}");
                $this->info("✓ Email: {$user['email']}");
                $this->info("✓ Country: {$user['site_id']}");
            } else {
                $this->error("❌ Failed to get user info");
                $this->error("Status: {$response->status()}");
                $this->error("Response: " . $response->body());
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("❌ Exception: " . $e->getMessage());
            return 1;
        }

        $this->newLine();

        // Test 2: Create a test preference
        $this->info('Test 2: Creating test preference...');
        try {
            $successUrl = url('/test/success');
            $failureUrl = url('/test/failure');
            $pendingUrl = url('/test/pending');

            $this->info("Success URL: {$successUrl}");
            $this->info("Failure URL: {$failureUrl}");
            $this->info("Pending URL: {$pendingUrl}");

            $testData = [
                'items' => [
                    [
                        'title' => 'Test Product',
                        'description' => 'Test Description',
                        'quantity' => 1,
                        'currency_id' => 'COP',
                        'unit_price' => 10000,
                    ]
                ],
                'back_urls' => [
                    'success' => $successUrl,
                    'failure' => $failureUrl,
                    'pending' => $pendingUrl,
                ],
                'external_reference' => 'test_' . time(),
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ])->post("{$apiUrl}/checkout/preferences", $testData);

            if ($response->successful()) {
                $preference = $response->json();
                $this->info("✓ Preference created successfully");
                $this->info("✓ Preference ID: {$preference['id']}");
                $this->info("✓ Init Point: {$preference['init_point']}");
            } else {
                $this->error("❌ Failed to create preference");
                $this->error("Status: {$response->status()}");
                $this->error("Response: " . $response->body());
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("❌ Exception: " . $e->getMessage());
            return 1;
        }

        $this->newLine();
        $this->info('✅ All tests passed! MercadoPago is configured correctly.');

        return 0;
    }
}
