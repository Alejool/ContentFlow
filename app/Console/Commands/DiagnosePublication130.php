<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use Illuminate\Console\Command;

class DiagnosePublication130 extends Command
{
    protected $signature = 'diagnose:publication-130';
    protected $description = 'Diagnose publication 130 recurrence issues';

    public function handle()
    {
        $pub = Publication::find(130);
        
        if (!$pub) {
            $this->error('Publication 130 not found');
            return;
        }

        $this->info('=== Publication Info ===');
        $this->line("ID: {$pub->id}");
        $this->line("Title: {$pub->title}");
        $this->line("Scheduled At: {$pub->scheduled_at}");
        $this->line("Is Recurring: " . ($pub->is_recurring ? 'Yes' : 'No'));
        
        $settings = $pub->recurrenceSettings;
        if ($settings) {
            $this->info("\n=== Recurrence Settings ===");
            $this->line("Type: {$settings->recurrence_type}");
            $this->line("Interval: {$settings->recurrence_interval}");
            $this->line("Days: " . json_encode($settings->recurrence_days));
            $this->line("End Date: {$settings->recurrence_end_date}");
            $this->line("Accounts: " . json_encode($settings->recurrence_accounts));
        }

        $this->info("\n=== Scheduled Posts ===");
        $posts = $pub->scheduledPosts()->orderBy('scheduled_at')->get();
        
        foreach ($posts as $post) {
            $isRecurring = $post->is_recurring_instance ? 'RECURRING' : 'ORIGINAL';
            $this->line("ID: {$post->id} | Account: {$post->social_account_id} | {$post->scheduled_at} | {$isRecurring}");
        }

        $this->info("\n=== Analysis ===");
        $originalPosts = $posts->where('is_recurring_instance', false);
        $recurringPosts = $posts->where('is_recurring_instance', true);
        
        $this->line("Original posts: " . $originalPosts->count());
        $this->line("Recurring posts: " . $recurringPosts->count());
        
        if ($originalPosts->count() > 0) {
            $earliest = $originalPosts->sortBy('scheduled_at')->first();
            $this->line("Earliest original post: {$earliest->scheduled_at}");
            $this->line("Publication scheduled_at: {$pub->scheduled_at}");
            $this->line("Match: " . ($earliest->scheduled_at->eq($pub->scheduled_at) ? 'YES' : 'NO'));
        }
    }
}
