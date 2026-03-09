<?php

namespace App\Console\Commands;

use App\Services\Payment\CurrencyConversionService;
use Illuminate\Console\Command;

class UpdateExchangeRates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'currency:update-rates
                            {--clear : Clear cached rates before updating}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update exchange rates from external API';

    /**
     * Execute the console command.
     */
    public function handle(CurrencyConversionService $currencyService): int
    {
        $this->info('Updating exchange rates...');

        if ($this->option('clear')) {
            $this->info('Clearing cached rates...');
            $currencyService->clearExchangeRateCache();
        }

        try {
            $updated = $currencyService->updateExchangeRates();

            if (empty($updated)) {
                $this->warn('No rates were updated. Check your EXCHANGE_RATE_API_KEY configuration.');
                $this->info('Using fallback rates from config/payment.php');
                return self::SUCCESS;
            }

            $this->info('Exchange rates updated successfully:');
            
            $this->table(
                ['Currency', 'Rate (USD)'],
                collect($updated)->map(fn($rate, $currency) => [$currency, $rate])->toArray()
            );

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Error updating exchange rates: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
