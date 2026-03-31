<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Publications\Publication;

class DiagnoseRecurrenceEndDate extends Command
{
    protected $signature = 'diagnose:recurrence-end-date {publication_id?}';
    protected $description = 'Diagnose recurrence end date issues';

    public function handle()
    {
        $publicationId = $this->argument('publication_id');

        if ($publicationId) {
            $publication = Publication::withoutGlobalScope('workspace')->find($publicationId);
            
            if (!$publication) {
                $this->error("Publication not found: {$publicationId}");
                return 1;
            }

            $this->info("Publication ID: {$publication->id}");
            $this->info("Title: {$publication->title}");
            $this->info("Is Recurring: " . ($publication->is_recurring ? 'Yes' : 'No'));
            $this->info("Scheduled At: {$publication->scheduled_at}");
            $this->info("Recurrence End Date: {$publication->recurrence_end_date}");
            $this->info("Recurrence Type: {$publication->recurrence_type}");
            $this->info("Recurrence Interval: {$publication->recurrence_interval}");
            $this->info("Recurrence Days: " . json_encode($publication->recurrence_days));
            $this->info("Recurrence Accounts: " . json_encode($publication->recurrence_accounts));
            
            $this->newLine();
            $this->info("Scheduled Posts:");
            $scheduledPosts = $publication->scheduled_posts()->orderBy('scheduled_at')->get();
            foreach ($scheduledPosts as $post) {
                $this->line("  - Account {$post->social_account_id}: {$post->scheduled_at} ({$post->status})");
            }
        } else {
            $publications = Publication::withoutGlobalScope('workspace')
                ->where('is_recurring', true)
                ->get();

            $this->info("Found {$publications->count()} recurring publications:");
            $this->newLine();

            foreach ($publications as $pub) {
                $this->info("ID: {$pub->id} | Title: {$pub->title}");
                $this->line("  Scheduled: {$pub->scheduled_at}");
                $this->line("  End Date: {$pub->recurrence_end_date}");
                $this->line("  Type: {$pub->recurrence_type} | Interval: {$pub->recurrence_interval}");
                $this->newLine();
            }
        }

        return 0;
    }
}
