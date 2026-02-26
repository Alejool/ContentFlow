<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixApprovedRetriesNull extends Command
{
    protected $signature = 'publications:fix-approved-retries';
    protected $description = 'Fix NULL values in approved_retries_remaining column';

    public function handle()
    {
        $this->info('Fixing NULL values in approved_retries_remaining...');
        
        $updated = DB::table('publications')
            ->whereNull('approved_retries_remaining')
            ->update(['approved_retries_remaining' => 2]);
        
        $this->info("Updated {$updated} publications.");
        
        return 0;
    }
}
