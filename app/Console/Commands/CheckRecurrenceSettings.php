<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationRecurrenceSetting;

class CheckRecurrenceSettings extends Command
{
    protected $signature = 'check:recurrence-settings {publication_id}';
    protected $description = 'Check if recurrence settings exist for a publication';

    public function handle()
    {
        $publicationId = $this->argument('publication_id');
        
        $this->info("Checking publication {$publicationId}...");
        
        $publication = Publication::withoutGlobalScope('workspace')->find($publicationId);
        
        if (!$publication) {
            $this->error("Publication not found");
            return 1;
        }
        
        $this->info("Publication found: {$publication->title}");
        $this->info("Is recurring: " . ($publication->is_recurring ? 'Yes' : 'No'));
        
        $settings = PublicationRecurrenceSetting::where('publication_id', $publicationId)->first();
        
        if ($settings) {
            $this->info("✓ Settings found in publication_recurrence_settings table:");
            $this->line("  Type: {$settings->recurrence_type}");
            $this->line("  Interval: {$settings->recurrence_interval}");
            $this->line("  Days: " . json_encode($settings->recurrence_days));
            $this->line("  End Date: {$settings->recurrence_end_date}");
            $this->line("  Accounts: " . json_encode($settings->recurrence_accounts));
        } else {
            $this->warn("✗ No settings found in publication_recurrence_settings table");
            $this->info("Old fields in publications table:");
            $this->line("  Type: {$publication->recurrence_type}");
            $this->line("  Interval: {$publication->recurrence_interval}");
            $this->line("  Days: " . json_encode($publication->recurrence_days));
            $this->line("  End Date: {$publication->recurrence_end_date}");
            $this->line("  Accounts: " . json_encode($publication->recurrence_accounts));
        }
        
        return 0;
    }
}
