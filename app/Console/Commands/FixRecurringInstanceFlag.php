<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use App\Models\Social\ScheduledPost;
use App\Models\Social\SocialPostLog;
use Illuminate\Console\Command;

class FixRecurringInstanceFlag extends Command
{
    protected $signature = 'fix:recurring-instance-flag {--dry-run : Show what would be fixed without making changes}';
    protected $description = 'Fix is_recurring_instance flag for scheduled posts that should be marked as recurring instances';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
        }
        
        $this->info('Analyzing scheduled posts...');
        
        // Find all publications with recurrence enabled
        $recurringPublications = Publication::where('is_recurring', true)->get();
        
        $this->info("Found {$recurringPublications->count()} publications with recurrence enabled");
        
        $totalFixed = 0;
        $totalAnalyzed = 0;
        
        foreach ($recurringPublications as $publication) {
            $this->line("\n📄 Publication #{$publication->id}: {$publication->title}");
            
            // Get all scheduled posts for this publication
            $scheduledPosts = ScheduledPost::where('publication_id', $publication->id)
                ->where('status', 'pending')
                ->orderBy('social_account_id')
                ->orderBy('scheduled_at')
                ->get();
            
            if ($scheduledPosts->isEmpty()) {
                $this->line('  ℹ️  No pending scheduled posts');
                continue;
            }
            
            // Group by account
            $postsByAccount = $scheduledPosts->groupBy('social_account_id');
            
            foreach ($postsByAccount as $accountId => $posts) {
                $totalAnalyzed += $posts->count();
                
                // Check if this account was already published
                $wasPublished = SocialPostLog::where('publication_id', $publication->id)
                    ->where('social_account_id', $accountId)
                    ->where('status', 'published')
                    ->exists();
                
                if ($wasPublished) {
                    // ALL scheduled posts for this account should be recurring instances
                    $incorrectPosts = $posts->where('is_recurring_instance', false);
                    
                    if ($incorrectPosts->isNotEmpty()) {
                        $this->warn("  ⚠️  Account #{$accountId}: Found {$incorrectPosts->count()} posts marked as original but should be recurring (already published)");
                        
                        foreach ($incorrectPosts as $post) {
                            $this->line("     - Post #{$post->id}: {$post->scheduled_at} (is_recurring_instance: false → should be true)");
                            
                            if (!$dryRun) {
                                $post->update(['is_recurring_instance' => true]);
                            }
                            $totalFixed++;
                        }
                    }
                } else {
                    // First post should be original (false), rest should be recurring (true)
                    $sortedPosts = $posts->sortBy('scheduled_at')->values();
                    
                    foreach ($sortedPosts as $index => $post) {
                        $shouldBeRecurring = $index > 0;
                        $isMarkedAsRecurring = $post->is_recurring_instance;
                        
                        if ($shouldBeRecurring !== $isMarkedAsRecurring) {
                            $this->warn("  ⚠️  Account #{$accountId}: Post #{$post->id} at {$post->scheduled_at}");
                            $this->line("     Current: is_recurring_instance = " . ($isMarkedAsRecurring ? 'true' : 'false'));
                            $this->line("     Should be: is_recurring_instance = " . ($shouldBeRecurring ? 'true' : 'false'));
                            
                            if (!$dryRun) {
                                $post->update(['is_recurring_instance' => $shouldBeRecurring]);
                                $totalFixed++;
                            }
                        }
                    }
                }
            }
        }
        
        $this->newLine();
        $this->info("📊 Summary:");
        $this->line("  Total scheduled posts analyzed: {$totalAnalyzed}");
        
        if ($dryRun) {
            $this->line("  Posts that would be fixed: {$totalFixed}");
            $this->newLine();
            $this->info('💡 Run without --dry-run to apply the fixes');
        } else {
            $this->line("  Posts fixed: {$totalFixed}");
            $this->newLine();
            $this->info('✅ Done!');
        }
        
        return 0;
    }
}
