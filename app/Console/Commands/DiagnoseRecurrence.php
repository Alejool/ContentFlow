<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use App\Models\Social\ScheduledPost;
use Illuminate\Console\Command;
use Carbon\Carbon;

class DiagnoseRecurrence extends Command
{
    protected $signature = 'diagnose:recurrence {publication_id}';
    protected $description = 'Diagnose recurrence calculation for a publication';

    public function handle()
    {
        $publicationId = $this->argument('publication_id');
        $publication = Publication::find($publicationId);

        if (!$publication) {
            $this->error("Publication {$publicationId} not found");
            return 1;
        }

        $this->info("=== Publication Details ===");
        $this->line("ID: {$publication->id}");
        $this->line("Title: {$publication->title}");
        $this->line("Scheduled At: {$publication->scheduled_at}");
        $this->line("Is Recurring: " . ($publication->is_recurring ? 'Yes' : 'No'));
        
        if ($publication->is_recurring) {
            $this->line("Recurrence Type: {$publication->recurrence_type}");
            $this->line("Recurrence Interval: {$publication->recurrence_interval}");
            $this->line("Recurrence Days: " . json_encode($publication->recurrence_days));
            $this->line("Recurrence End Date: {$publication->recurrence_end_date}");
        }

        $this->info("\n=== Scheduled Posts ===");
        $scheduledPosts = ScheduledPost::where('publication_id', $publication->id)
            ->orderBy('scheduled_at')
            ->get();

        if ($scheduledPosts->isEmpty()) {
            $this->warn("No scheduled posts found");
        } else {
            foreach ($scheduledPosts as $post) {
                $this->line("{$post->id} - {$post->scheduled_at} - {$post->status} - Account: {$post->social_account_id}");
            }
        }

        if ($publication->is_recurring && $publication->scheduled_at) {
            $this->info("\n=== Calculating Expected Dates ===");
            $dates = $this->calculateRecurrenceDates($publication);
            
            $this->line("Base Date: {$publication->scheduled_at}");
            $this->line("Expected recurrence dates:");
            foreach ($dates as $idx => $date) {
                $this->line(($idx + 1) . ". {$date}");
            }
        }

        return 0;
    }

    protected function calculateRecurrenceDates(Publication $publication): array
    {
        $baseDate = $publication->scheduled_at;
        if (!$baseDate) {
            return [];
        }

        $dates = [];
        $startDate = Carbon::parse($baseDate);
        $endDate = $publication->recurrence_end_date ? Carbon::parse($publication->recurrence_end_date) : null;
        $interval = max(1, (int)($publication->recurrence_interval ?? 1));

        if (!$endDate) {
            $endDate = now()->addMonths(3);
        }

        $currentDate = clone $startDate;
        $count = 0;
        
        while ($currentDate->lessThanOrEqualTo($endDate) && $count < 50) {
            $count++;

            // Skip first iteration
            if ($count > 1) {
                if ($currentDate->greaterThanOrEqualTo(now()->subMinutes(5))) {
                    $dates[] = $currentDate->toIso8601String();
                }
            }

            if (count($dates) >= 50) {
                break;
            }

            switch ($publication->recurrence_type) {
                case 'daily':
                    $currentDate->addDays((int)$interval);
                    break;
                case 'weekly':
                    if (!empty($publication->recurrence_days)) {
                        $currentDay = $currentDate->dayOfWeek;
                        $nextDay = null;

                        $sortedDays = array_map('intval', $publication->recurrence_days);
                        sort($sortedDays);

                        $this->line("Current day: {$currentDay}, Sorted days: " . json_encode($sortedDays));

                        foreach ($sortedDays as $day) {
                            if ($day > $currentDay) {
                                $nextDay = $day;
                                break;
                            }
                        }

                        if ($nextDay !== null) {
                            $daysToAdd = (int)($nextDay - $currentDay);
                            $this->line("Adding {$daysToAdd} days to reach day {$nextDay}");
                            $currentDate->addDays($daysToAdd);
                        } else {
                            $nextDay = $sortedDays[0];
                            $daysToSubtract = (int)$currentDay;
                            $weeksToAdd = (int)$interval;
                            $daysToAdd = (int)$nextDay;
                            $this->line("Jumping to next cycle: -{$daysToSubtract} days, +{$weeksToAdd} weeks, +{$daysToAdd} days");
                            $currentDate->subDays($daysToSubtract)->addWeeks($weeksToAdd)->addDays($daysToAdd);
                        }
                    } else {
                        $currentDate->addWeeks((int)$interval);
                    }
                    break;
                case 'monthly':
                    $currentDate->addMonths((int)$interval);
                    break;
                case 'yearly':
                    $currentDate->addYears((int)$interval);
                    break;
            }
        }

        return $dates;
    }
}
