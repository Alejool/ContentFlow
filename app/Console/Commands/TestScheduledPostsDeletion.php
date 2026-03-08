<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use App\Models\Social\ScheduledPost;
use Illuminate\Console\Command;

class TestScheduledPostsDeletion extends Command
{
    protected $signature = 'test:scheduled-posts-deletion {publication_id}';
    protected $description = 'Test scheduled posts deletion for a publication';

    public function handle()
    {
        $publicationId = $this->argument('publication_id');
        $publication = Publication::find($publicationId);

        if (!$publication) {
            $this->error("Publication {$publicationId} not found");
            return 1;
        }

        $this->info("Publication: {$publication->title}");
        $this->info("Status: {$publication->status}");
        $this->info("Is Recurring: " . ($publication->is_recurring ? 'Yes' : 'No'));
        $this->newLine();

        // Get all scheduled posts
        $scheduledPosts = ScheduledPost::where('publication_id', $publicationId)
            ->orderBy('social_account_id')
            ->orderBy('scheduled_at')
            ->get();

        if ($scheduledPosts->isEmpty()) {
            $this->warn("No scheduled posts found for this publication");
            return 0;
        }

        $this->info("Total Scheduled Posts: {$scheduledPosts->count()}");
        $this->newLine();

        // Group by status
        $byStatus = $scheduledPosts->groupBy('status');
        $this->info("By Status:");
        foreach ($byStatus as $status => $posts) {
            $this->line("  - {$status}: {$posts->count()}");
        }
        $this->newLine();

        // Group by account
        $byAccount = $scheduledPosts->groupBy('social_account_id');
        $this->info("By Social Account:");
        foreach ($byAccount as $accountId => $posts) {
            $accountName = $posts->first()->account_name ?? 'Unknown';
            $platform = $posts->first()->platform ?? 'Unknown';
            $this->line("  - Account {$accountId} ({$platform} - {$accountName}): {$posts->count()} posts");
            
            // Show breakdown by status for this account
            $accountByStatus = $posts->groupBy('status');
            foreach ($accountByStatus as $status => $statusPosts) {
                $recurringCount = $statusPosts->where('is_recurring_instance', true)->count();
                $originalCount = $statusPosts->where('is_recurring_instance', false)->count();
                $this->line("    - {$status}: {$statusPosts->count()} (Original: {$originalCount}, Recurring: {$recurringCount})");
            }
        }
        $this->newLine();

        // Show pending posts details
        $pendingPosts = $scheduledPosts->where('status', 'pending');
        if ($pendingPosts->isNotEmpty()) {
            $this->info("Pending Posts Details:");
            $this->table(
                ['ID', 'Account', 'Platform', 'Scheduled At', 'Recurring', 'Status'],
                $pendingPosts->map(function ($post) {
                    return [
                        $post->id,
                        $post->account_name ?? 'Unknown',
                        $post->platform ?? 'Unknown',
                        $post->scheduled_at->format('Y-m-d H:i:s'),
                        $post->is_recurring_instance ? 'Yes' : 'No',
                        $post->status,
                    ];
                })
            );
        }

        return 0;
    }
}
