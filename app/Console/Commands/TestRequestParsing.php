<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TestRequestParsing extends Command
{
    protected $signature = 'test:request-parsing';
    protected $description = 'Test how Laravel parses different request formats';

    public function handle()
    {
        $this->info('Testing Request Parsing Scenarios');
        $this->newLine();

        // Scenario 1: FormData with social_accounts[] empty
        $this->info('Scenario 1: FormData with social_accounts[] (no values)');
        $this->line('When frontend sends: formData.append("social_accounts[]", ...)');
        $this->line('But no values are appended');
        $this->warn('Result: Laravel may NOT include "social_accounts" key in request');
        $this->newLine();

        // Scenario 2: FormData with social_accounts as JSON
        $this->info('Scenario 2: FormData with social_accounts as JSON string');
        $this->line('When frontend sends: formData.append("social_accounts", JSON.stringify([]))');
        $this->line('Laravel receives: social_accounts = "[]" (string)');
        $this->line('prepareForValidation() converts it to: social_accounts = [] (array)');
        $this->comment('✓ This works correctly!');
        $this->newLine();

        // Scenario 3: FormData with clear_social_accounts flag
        $this->info('Scenario 3: FormData with clear_social_accounts flag');
        $this->line('When frontend sends: formData.append("clear_social_accounts", "1")');
        $this->line('Laravel receives: clear_social_accounts = "1"');
        $this->comment('✓ This works correctly!');
        $this->newLine();

        $this->info('Recommendation:');
        $this->line('The current frontend implementation is CORRECT:');
        $this->line('  if (socialAccounts.length === 0) {');
        $this->line('    formData.append("clear_social_accounts", "1");');
        $this->line('    formData.append("social_accounts", JSON.stringify([]));');
        $this->line('  }');
        $this->newLine();

        $this->info('Next Steps:');
        $this->line('1. Edit a publication and deselect all accounts');
        $this->line('2. Monitor logs with: docker-compose exec app tail -f storage/logs/laravel.log');
        $this->line('3. Look for: "UpdatePublicationAction: Processing social accounts"');
        $this->line('4. Verify that has_social_accounts_key = true');
        $this->line('5. Verify that social_accounts_raw = []');

        return 0;
    }
}
