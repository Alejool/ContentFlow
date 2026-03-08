<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use Illuminate\Console\Command;

class DiagnoseRecurringPosts extends Command
{
    protected $signature = 'diagnose:recurring-posts {publicationId}';
    protected $description = 'Diagnose recurring posts for a publication';

    public function handle()
    {
        $pubId = $this->argument('publicationId');
        $pub = Publication::with(['recurrenceSettings', 'scheduledPosts'])->find($pubId);
        
        if (!$pub) {
            $this->error("Publication {$pubId} not found");
            return;
        }

        $this->info("=== Publication Info ===");
        $this->line("ID: {$pub->id}");
        $this->line("Title: {$pub->title}");
        $this->line("Is Recurring: " . ($pub->is_recurring ? 'YES' : 'NO'));
        $this->line("Scheduled At: {$pub->scheduled_at}");
        
        if ($pub->recurrenceSettings) {
            $this->info("\n=== Recurrence Settings ===");
            $this->line("Type: {$pub->recurrenceSettings->recurrence_type}");
            $this->line("Interval: {$pub->recurrenceSettings->recurrence_interval}");
            $this->line("Days: " . json_encode($pub->recurrenceSettings->recurrence_days));
            $this->line("End Date: {$pub->recurrenceSettings->recurrence_end_date}");
            $this->line("Accounts: " . json_encode($pub->recurrenceSettings->recurrence_accounts));
        }

        $this->info("\n=== Scheduled Posts ===");
        $posts = $pub->scheduledPosts()->orderBy('social_account_id')->orderBy('scheduled_at')->get();
        
        $byAccount = $posts->groupBy('social_account_id');
        
        foreach ($byAccount as $accountId => $accountPosts) {
            $this->line("\nAccount ID: {$accountId}");
            foreach ($accountPosts as $post) {
                $type = $post->is_recurring_instance ? 'RECURRING' : 'ORIGINAL';
                $status = $post->status;
                $this->line("  - Post {$post->id}: {$post->scheduled_at} | {$type} | {$status}");
            }
        }

        $this->info("\n=== Summary ===");
        $originals = $posts->where('is_recurring_instance', false)->count();
        $recurring = $posts->where('is_recurring_instance', true)->count();
        $this->line("Original posts: {$originals}");
        $this->line("Recurring posts: {$recurring}");
        $this->line("Total posts: " . $posts->count());
    }
}
