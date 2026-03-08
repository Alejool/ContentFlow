<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use App\Models\Social\ScheduledPost;
use App\Models\Social\SocialPostLog;
use Illuminate\Console\Command;

class TestPublishedPlatforms extends Command
{
    protected $signature = 'test:published-platforms {publication_id}';
    protected $description = 'Test the published platforms logic for a publication';

    public function handle()
    {
        $publicationId = $this->argument('publication_id');
        
        $publication = Publication::find($publicationId);
        
        if (!$publication) {
            $this->error("Publication #{$publicationId} not found");
            return 1;
        }
        
        $this->info("Testing publication #{$publicationId}: {$publication->title}");
        $this->newLine();
        
        // Get social_post_logs
        $logs = SocialPostLog::where('publication_id', $publicationId)
            ->select('social_account_id', 'status', 'published_at')
            ->whereIn('id', function ($query) use ($publicationId) {
                $query->selectRaw('MAX(id)')
                    ->from('social_post_logs')
                    ->where('publication_id', $publicationId)
                    ->groupBy('social_account_id');
            })
            ->get();
        
        $this->info("=== Social Post Logs ===");
        foreach ($logs as $log) {
            $this->line("Account #{$log->social_account_id}: {$log->status} at {$log->published_at}");
        }
        $this->newLine();
        
        // Get published account IDs
        $publishedAccountIds = $logs->where('status', 'published')->pluck('social_account_id')->toArray();
        $this->info("Published accounts: " . implode(', ', $publishedAccountIds));
        $this->newLine();
        
        // Get scheduled_posts
        $scheduledPosts = ScheduledPost::where('publication_id', $publicationId)
            ->where('status', 'pending')
            ->orderBy('social_account_id')
            ->orderBy('scheduled_at')
            ->get();
        
        $this->info("=== Scheduled Posts ===");
        foreach ($scheduledPosts as $post) {
            $recurring = $post->is_recurring_instance ? 'RECURRING' : 'ORIGINAL';
            $this->line("Post #{$post->id}: Account #{$post->social_account_id} | {$post->scheduled_at} | {$recurring}");
        }
        $this->newLine();
        
        // Get scheduled account IDs (only originals, excluding published)
        $scheduledAccountIds = ScheduledPost::where('publication_id', $publicationId)
            ->where('status', 'pending')
            ->where('is_recurring_instance', false)
            ->whereNotIn('social_account_id', $publishedAccountIds)
            ->pluck('social_account_id')
            ->unique()
            ->values()
            ->toArray();
        
        $this->info("=== Result ===");
        $this->line("Published platforms: " . implode(', ', $publishedAccountIds));
        $this->line("Scheduled platforms (originals only, excluding published): " . implode(', ', $scheduledAccountIds));
        
        return 0;
    }
}
