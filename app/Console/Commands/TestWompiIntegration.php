<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Payment\PaymentGatewayFactory;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TestWompiIntegration extends Command
{
    protected $signature = 'wompi:test {--user-id=1}';
    protected $description = 'Test Wompi payment gateway integration';

    public function handle()
    {
        $this->info('🧪 Testing Wompi Integration...');
        $this->newLine();

        // 1. Verificar configuración
        $this->info('1️⃣ Checking configuration...');
        $this->checkConfiguration();
        $this->newLine();

        // 2. Verificar disponibilidad del gateway
        $this->info('2️⃣ Checking gateway availability...');
        $this->checkGatewayAvailability();
        $this->newLine();

        // 3. Probar conexión con API de Wompi
        $this->info('3️⃣ Testing Wompi API connection...');
        $this->testApiConnection();
        $this->newLine();

        // 4. Crear Payment Link de prueba (opcional)
        if ($this->confirm('Do you want to create a test payment link?', false)) {
            $this->info('4️⃣ Creating test payment link...');
            $this->createTestPaymentLink();
            $this->newLine();
        }

        $this->info('✅ Wompi integration test completed!');
    }

    private function checkConfiguration(): void
    {
        $publicKey = config('services.wompi.public_key');
        $privateKey = config('services.wompi.private_key');
        $eventSecret = config('services.wompi.event_secret');
        $testMode = config('services.wompi.test_mode');

        $this->table(
            ['Config Key', 'Value', 'Status'],
            [
                ['WOMPI_PUBLIC_KEY', $this->maskKey($publicKey), $publicKey ? '✅' : '❌'],
                ['WOMPI_PRIVATE_KEY', $this->maskKey($privateKey), $privateKey ? '✅' : '❌'],
                ['WOMPI_EVENT_SECRET', $this->maskKey($eventSecret), $eventSecret ? '✅' : '⚠️'],
                ['WOMPI_TEST_MODE', $testMode ? 'true' : 'false', '✅'],
            ]
        );

        if (!$publicKey || !$privateKey) {
            $this->error('❌ Missing required Wompi credentials!');
            $this->info('Please configure WOMPI_PUBLIC_KEY and WOMPI_PRIVATE_KEY in your .env file');
            exit(1);
        }

        if (!$eventSecret) {
            $this->warn('⚠️  WOMPI_EVENT_SECRET not configured. Webhook signature verification will be skipped.');
        }
    }

    private function checkGatewayAvailability(): void
    {
        try {
            $gateway = PaymentGatewayFactory::make('wompi');
            
            if ($gateway->isAvailable()) {
                $this->info('✅ Wompi gateway is available');
                $this->info('   Gateway name: ' . $gateway->getName());
            } else {
                $this->error('❌ Wompi gateway is not available');
                exit(1);
            }
        } catch (\Exception $e) {
            $this->error('❌ Failed to instantiate Wompi gateway');
            $this->error('   Error: ' . $e->getMessage());
            exit(1);
        }
    }

    private function testApiConnection(): void
    {
        $publicKey = config('services.wompi.public_key');
        
        try {
            // Obtener información del merchant (endpoint público)
            $response = Http::get('https://production.wompi.co/v1/merchants/' . $publicKey);

            if ($response->successful()) {
                $data = $response->json()['data'] ?? [];
                
                $this->info('✅ Successfully connected to Wompi API');
                $this->table(
                    ['Field', 'Value'],
                    [
                        ['Merchant ID', $data['id'] ?? 'N/A'],
                        ['Name', $data['name'] ?? 'N/A'],
                        ['Email', $data['email'] ?? 'N/A'],
                        ['Contact Name', $data['contact_name'] ?? 'N/A'],
                        ['Active', ($data['active'] ?? false) ? 'Yes' : 'No'],
                    ]
                );

                // Mostrar métodos de pago aceptados
                $paymentMethods = $data['payment_methods'] ?? [];
                if (!empty($paymentMethods)) {
                    $this->info('💳 Accepted payment methods:');
                    foreach ($paymentMethods as $method) {
                        $this->line('   - ' . ($method['type'] ?? 'Unknown'));
                    }
                }
            } else {
                $this->error('❌ Failed to connect to Wompi API');
                $this->error('   Status: ' . $response->status());
                $this->error('   Body: ' . $response->body());
            }
        } catch (\Exception $e) {
            $this->error('❌ Exception while connecting to Wompi API');
            $this->error('   Error: ' . $e->getMessage());
        }
    }

    private function createTestPaymentLink(): void
    {
        $userId = $this->option('user-id');
        $user = User::find($userId);

        if (!$user) {
            $this->error("❌ User with ID {$userId} not found");
            return;
        }

        $workspace = $user->workspaces()->first();
        if (!$workspace) {
            $this->error("❌ User has no workspace");
            return;
        }

        try {
            $gateway = PaymentGatewayFactory::make('wompi');

            // Crear un addon de prueba
            $checkout = $gateway->createAddonCheckout(
                workspace: $workspace,
                user: $user,
                addonData: [
                    'sku' => 'test_addon',
                    'name' => 'Test Addon - Wompi Integration',
                    'description' => 'This is a test addon for Wompi integration',
                    'price' => 1.00, // $1 USD = ~4000 COP
                    'amount' => 1,
                    'unit' => 'test',
                ],
                metadata: [
                    'test' => true,
                    'command' => 'wompi:test',
                ]
            );

            $this->info('✅ Test payment link created successfully!');
            $this->newLine();
            $this->table(
                ['Field', 'Value'],
                [
                    ['Payment Link URL', $checkout['url'] ?? 'N/A'],
                    ['Payment Link ID', $checkout['payment_link_id'] ?? 'N/A'],
                    ['Reference', $checkout['reference'] ?? 'N/A'],
                    ['Gateway', $checkout['gateway'] ?? 'N/A'],
                ]
            );
            $this->newLine();
            $this->info('🌐 Open this URL in your browser to test the payment:');
            $this->line('   ' . ($checkout['url'] ?? 'N/A'));
            $this->newLine();
            $this->warn('⚠️  This is a test payment. Use test card: 4242 4242 4242 4242');
        } catch (\Exception $e) {
            $this->error('❌ Failed to create test payment link');
            $this->error('   Error: ' . $e->getMessage());
            $this->error('   Trace: ' . $e->getTraceAsString());
        }
    }

    private function maskKey(?string $key): string
    {
        if (!$key) {
            return 'Not configured';
        }

        if (strlen($key) <= 8) {
            return str_repeat('*', strlen($key));
        }

        return substr($key, 0, 8) . str_repeat('*', strlen($key) - 8);
    }
}
