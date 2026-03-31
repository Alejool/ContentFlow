<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Publications\Publication;
use App\Models\Social\ScheduledPost;

class MarkRecurringInstances extends Command
{
    protected $signature = 'scheduled-posts:mark-recurring-instances';
    protected $description = 'Mark existing scheduled posts as recurring instances based on their dates';

    public function handle()
    {
        $this->info('Marking recurring instances in scheduled posts...');

        // Get all recurring publications
        $publications = Publication::withoutGlobalScope('workspace')
            ->where('is_recurring', true)
            ->get();

        $this->info("Found {$publications->count()} recurring publications");

        $totalUpdated = 0;

        foreach ($publications as $publication) {
            $this->line("Processing publication: {$publication->id} - {$publication->title}");

            // Get all pending scheduled posts for this publication, grouped by account
            $postsByAccount = ScheduledPost::where('publication_id', $publication->id)
                ->where('status', 'pending')
                ->orderBy('social_account_id')
                ->orderBy('scheduled_at')
                ->get()
                ->groupBy('social_account_id');

            foreach ($postsByAccount as $accountId => $posts) {
                if ($posts->count() <= 1) {
                    // Only one post for this account, it's the original
                    $posts->first()->update(['is_recurring_instance' => false]);
                    continue;
                }

                // First post is the original, rest are recurring instances
                foreach ($posts as $index => $post) {
                    $isRecurringInstance = $index > 0;
                    $post->update(['is_recurring_instance' => $isRecurringInstance]);
                    
                    if ($isRecurringInstance) {
                        $totalUpdated++;
                    }
                }

                $this->line("  Account {$accountId}: {$posts->count()} posts (1 original, " . ($posts->count() - 1) . " recurring)");
            }
        }

        $this->info("✓ Marked {$totalUpdated} posts as recurring instances");

        return 0;
    }
}
