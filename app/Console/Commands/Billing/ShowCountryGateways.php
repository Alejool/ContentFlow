<?php

namespace App\Console\Commands\Billing;

use Illuminate\Console\Command;

class ShowCountryGateways extends Command
{
    protected $signature = 'show:country-gateways {country=CO}';
    protected $description = 'Show payment gateways configured for a country';

    public function handle()
    {
        $country = strtoupper($this->argument('country'));
        
        $this->info("Payment Gateway Configuration for {$country}:");
        $this->line('');

        // Gateway principal
        $primaryGateway = config("payment.country_gateways.{$country}");
        $this->info("Primary Gateway: " . ($primaryGateway ?? 'Not configured'));
        $this->line('');

        // Múltiples gateways
        $multipleGateways = config("payment.country_gateways_multiple.{$country}", []);
        $this->info("Multiple Gateways:");
        if (empty($multipleGateways)) {
            $this->warn("  No multiple gateways configured");
        } else {
            foreach ($multipleGateways as $gateway) {
                $this->line("  - {$gateway}");
            }
        }
        $this->line('');

        // Moneda
        $currency = config("payment.currencies.{$country}", 'USD');
        $this->info("Currency: {$currency}");

        return 0;
    }
}
