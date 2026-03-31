<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationRecurrenceSetting;

class MigrateRecurrenceSettings extends Command
{
    protected $signature = 'publications:migrate-recurrence-settings';
    protected $description = 'Migrate recurrence settings from publications table to publication_recurrence_settings table';

    public function handle()
    {
        $this->info('Migrating recurrence settings...');

        // Get all recurring publications
        $publications = Publication::withoutGlobalScope('workspace')
            ->where('is_recurring', true)
            ->get();

        $this->info("Found {$publications->count()} recurring publications");

        $migrated = 0;
        $skipped = 0;

        foreach ($publications as $publication) {
            // Check if settings already exist
            if ($publication->recurrenceSettings()->exists()) {
                $this->line("Skipping publication {$publication->id} - settings already exist");
                $skipped++;
                continue;
            }

            // Create recurrence settings
            PublicationRecurrenceSetting::create([
                'publication_id' => $publication->id,
                'recurrence_type' => $publication->recurrence_type ?? 'daily',
                'recurrence_interval' => $publication->recurrence_interval ?? 1,
                'recurrence_days' => $publication->recurrence_days,
                'recurrence_end_date' => $publication->recurrence_end_date,
                'recurrence_accounts' => $publication->recurrence_accounts,
            ]);

            $this->line("✓ Migrated publication {$publication->id} - {$publication->title}");
            $migrated++;
        }

        $this->newLine();
        $this->info("Migration complete!");
        $this->info("Migrated: {$migrated}");
        $this->info("Skipped: {$skipped}");

        return 0;
    }
}
