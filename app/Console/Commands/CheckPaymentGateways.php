<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\Payment\PaymentGatewayFactory;

class CheckPaymentGateways extends Command
{
    protected $signature = 'payment:check-gateways';
    protected $description = 'Check which payment gateways are available';

    public function handle()
    {
        $this->info('Checking Payment Gateways...');
        $this->newLine();

        $gateways = [
            'stripe' => 'Stripe',
            'mercadopago' => 'MercadoPago',
            'epayco' => 'ePayco',
            'payu' => 'PayU',
        ];

        foreach ($gateways as $name => $displayName) {
            try {
                $gateway = PaymentGatewayFactory::make($name);
                $available = $gateway->isAvailable();
                
                if ($available) {
                    $this->info("✓ {$displayName}: AVAILABLE");
                } else {
                    $this->warn("✗ {$displayName}: NOT AVAILABLE (missing credentials)");
                }

                // Mostrar qué credenciales faltan
                $this->showMissingCredentials($name);
                $this->newLine();
            } catch (\Exception $e) {
                $this->error("✗ {$displayName}: ERROR - {$e->getMessage()}");
                $this->newLine();
            }
        }

        // Mostrar gateways por país
        $this->info('Gateways by Country:');
        $countries = ['CO', 'MX', 'PE', 'AR', 'BR', 'CL', 'US'];
        
        foreach ($countries as $country) {
            $gateways = PaymentGatewayFactory::getGatewaysForCountry($country);
            $gatewayNames = array_keys($gateways);
            $this->line("{$country}: " . implode(', ', $gatewayNames));
        }

        return 0;
    }

    private function showMissingCredentials(string $gateway): void
    {
        $credentials = match ($gateway) {
            'stripe' => [
                'STRIPE_SECRET' => config('services.stripe.secret'),
                'STRIPE_PUBLISH' => config('services.stripe.public'),
            ],
            'mercadopago' => [
                'MERCADOPAGO_ACCESS_TOKEN' => config('services.mercadopago.access_token'),
                'MERCADOPAGO_PUBLIC_KEY' => config('services.mercadopago.public_key'),
            ],
            'epayco' => [
                'EPAYCO_PUBLIC_KEY' => config('services.epayco.public_key'),
                'EPAYCO_PRIVATE_KEY' => config('services.epayco.private_key'),
            ],
            'payu' => [
                'PAYU_API_KEY' => config('services.payu.api_key'),
                'PAYU_API_LOGIN' => config('services.payu.api_login'),
                'PAYU_MERCHANT_ID' => config('services.payu.merchant_id'),
                'PAYU_ACCOUNT_ID' => config('services.payu.account_id'),
            ],
            default => [],
        };

        foreach ($credentials as $key => $value) {
            if (empty($value)) {
                $this->line("  Missing: {$key}");
            } else {
                $length = strlen($value);
                $this->line("  {$key}: configured (length: {$length})");
            }
        }
    }
}
