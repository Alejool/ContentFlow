<?php

namespace App\Console\Commands\Billing;

use App\Models\System\SystemSetting;
use Illuminate\Console\Command;

class ShowPaymentSettings extends Command
{
    protected $signature = 'show:payment-settings';
    protected $description = 'Show payment gateway settings';

    public function handle()
    {
        $this->info('Payment Gateway Settings:');
        $this->line('');

        $gateways = ['stripe', 'mercadopago', 'payu', 'wompi', 'epayco'];
        
        foreach ($gateways as $gateway) {
            $enabled = SystemSetting::getFresh("payment.{$gateway}.enabled", false);
            $status = $enabled ? '✓ ENABLED' : '✗ DISABLED';
            $this->line("{$gateway}: {$status}");
        }

        return 0;
    }
}
