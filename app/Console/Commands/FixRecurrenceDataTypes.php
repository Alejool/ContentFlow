<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use Illuminate\Console\Command;

class FixRecurrenceDataTypes extends Command
{
    protected $signature = 'publications:fix-recurrence-types';
    protected $description = 'Fix recurrence_interval and recurrence_days data types in publications';

    public function handle()
    {
        $this->info('Fixing recurrence data types...');

        $publications = Publication::whereNotNull('recurrence_interval')
            ->orWhereNotNull('recurrence_days')
            ->get();

        $fixed = 0;

        foreach ($publications as $publication) {
            $needsUpdate = false;
            $updates = [];

            // Fix recurrence_interval
            if ($publication->recurrence_interval !== null) {
                $interval = (int)$publication->recurrence_interval;
                if ($interval !== $publication->recurrence_interval) {
                    $updates['recurrence_interval'] = max(1, $interval);
                    $needsUpdate = true;
                }
            }

            // Fix recurrence_days
            if ($publication->recurrence_days !== null && !empty($publication->recurrence_days)) {
                $days = is_array($publication->recurrence_days) 
                    ? $publication->recurrence_days 
                    : json_decode($publication->recurrence_days, true);
                
                if (is_array($days)) {
                    $intDays = array_map('intval', $days);
                    if ($intDays !== $publication->recurrence_days) {
                        $updates['recurrence_days'] = $intDays;
                        $needsUpdate = true;
                    }
                }
            }

            if ($needsUpdate) {
                $publication->updateQuietly($updates);
                $fixed++;
                $this->line("Fixed publication ID: {$publication->id}");
            }
        }

        $this->info("Fixed {$fixed} publications.");
        return 0;
    }
}
