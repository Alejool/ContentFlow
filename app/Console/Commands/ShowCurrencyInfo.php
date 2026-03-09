<?php

namespace App\Console\Commands;

use App\Services\Payment\CurrencyConversionService;
use Illuminate\Console\Command;

class ShowCurrencyInfo extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'currency:info
                            {--country= : Show info for specific country code}
                            {--price=10 : Test price in USD to convert}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Show currency conversion information and test conversions';

    /**
     * Execute the console command.
     */
    public function handle(CurrencyConversionService $currencyService): int
    {
        $this->info('Currency Conversion Information');
        $this->line('');

        $testPrice = (float) $this->option('price');
        $countryCode = $this->option('country');

        if ($countryCode) {
            // Mostrar info de un país específico
            $this->showCountryInfo($currencyService, strtoupper($countryCode), $testPrice);
        } else {
            // Mostrar info de todos los países configurados
            $this->showAllCountries($currencyService, $testPrice);
        }

        return self::SUCCESS;
    }

    private function showCountryInfo(CurrencyConversionService $currencyService, string $countryCode, float $testPrice): void
    {
        $this->info("Country: {$countryCode}");
        
        // Crear un workspace temporal con el país especificado
        $tempWorkspace = new \App\Models\Workspace\Workspace();
        $tempWorkspace->country = $countryCode;
        
        $result = $currencyService->convertPrice($testPrice, $tempWorkspace, null);
        
        $this->table(
            ['Property', 'Value'],
            [
                ['Currency', $result['currency']],
                ['Exchange Rate', $result['exchange_rate']],
                ['USD Price', '$' . number_format($result['usd_price'], 2)],
                ['Local Price', $result['local_price']],
                ['Formatted', $result['formatted']],
            ]
        );
    }

    private function showAllCountries(CurrencyConversionService $currencyService, float $testPrice): void
    {
        $currencies = config('payment.currencies', []);
        $rates = config('payment.exchange_rates', []);

        $this->info("Configured Currencies and Exchange Rates");
        $this->info("Test conversion: USD \${$testPrice}");
        $this->line('');

        $data = [];
        foreach ($currencies as $country => $currency) {
            $rate = $rates[$currency] ?? 1.0;
            $localPrice = $testPrice * $rate;
            
            $formatted = $currencyService->formatPrice($localPrice, $currency);
            
            $data[] = [
                $country,
                $currency,
                $rate,
                $formatted,
            ];
        }

        $this->table(
            ['Country', 'Currency', 'Rate', "USD \${$testPrice} ="],
            $data
        );

        $this->line('');
        $this->info('To update rates from API, run: php artisan currency:update-rates');
        $this->info('To test a specific country: php artisan currency:info --country=CO --price=9.99');
    }
}
