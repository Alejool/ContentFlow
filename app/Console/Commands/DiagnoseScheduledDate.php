<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use Illuminate\Console\Command;

class DiagnoseScheduledDate extends Command
{
    protected $signature = 'diagnose:scheduled-date {publication_id?}';
    protected $description = 'Diagnose scheduled_at date issues';

    public function handle()
    {
        $pubId = $this->argument('publication_id');
        
        if ($pubId) {
            $publication = Publication::find($pubId);
            if (!$publication) {
                $this->error("Publication not found: {$pubId}");
                return 1;
            }
            $publications = collect([$publication]);
        } else {
            $publications = Publication::whereNotNull('scheduled_at')
                ->latest()
                ->take(5)
                ->get();
        }

        if ($publications->isEmpty()) {
            $this->info('No scheduled publications found');
            return 0;
        }

        $this->info('Scheduled Publications:');
        $this->newLine();

        foreach ($publications as $pub) {
            $this->info("ID: {$pub->id}");
            $this->info("Title: {$pub->title}");
            $this->info("Status: {$pub->status}");
            $this->info("Scheduled At (Accessor): {$pub->scheduled_at}");
            $this->info("Scheduled At (Raw DB): {$pub->getRawOriginal('scheduled_at')}");
            $this->info("Is Recurring: " . ($pub->is_recurring ? 'Yes' : 'No'));
            
            // Check scheduled posts
            $scheduledPosts = $pub->scheduled_posts()->get();
            if ($scheduledPosts->isNotEmpty()) {
                $this->info("Scheduled Posts Count: {$scheduledPosts->count()}");
                foreach ($scheduledPosts as $sp) {
                    $this->info("  - Account: {$sp->socialAccount->account_name}, Scheduled: {$sp->scheduled_at}, Status: {$sp->status}");
                }
            }
            
            $this->newLine();
            $this->line(str_repeat('-', 80));
            $this->newLine();
        }

        return 0;
    }
}
