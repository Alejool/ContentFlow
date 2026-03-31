<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Publications\Publication;
use App\Models\Social\ScheduledPost;

class DiagnoseSchedulingIssues extends Command
{
    protected $signature = 'diagnose:scheduling {publication_id?}';
    protected $description = 'Diagnose scheduling and recurrence issues for publications';

    public function handle()
    {
        $publicationId = $this->argument('publication_id');
        
        if ($publicationId) {
            $this->diagnosePublication($publicationId);
        } else {
            $this->info('Showing recent publications with scheduling...');
            $publications = Publication::whereNotNull('scheduled_at')
                ->orWhere('is_recurring', true)
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get();
            
            $this->table(
                ['ID', 'Title', 'Scheduled At', 'Is Recurring', 'Status', 'Scheduled Posts'],
                $publications->map(function ($pub) {
                    return [
                        $pub->id,
                        substr($pub->title, 0, 30),
                        $pub->scheduled_at?->format('Y-m-d H:i:s'),
                        $pub->is_recurring ? 'Yes' : 'No',
                        $pub->status,
                        $pub->scheduled_posts()->count(),
                    ];
                })
            );
            
            $this->info("\nUse: php artisan diagnose:scheduling {publication_id} for details");
        }
    }
    
    private function diagnosePublication($id)
    {
        $pub = Publication::with(['recurrenceSettings', 'scheduled_posts'])->find($id);
        
        if (!$pub) {
            $this->error("Publication {$id} not found");
            return;
        }
        
        $this->info("=== Publication #{$pub->id}: {$pub->title} ===\n");
        
        // Basic info
        $this->info("Status: {$pub->status}");
        $this->info("Scheduled At: " . ($pub->scheduled_at ? $pub->scheduled_at->format('Y-m-d H:i:s T') : 'NULL'));
        $this->info("Is Recurring: " . ($pub->is_recurring ? 'Yes' : 'No'));
        
        // Recurrence settings
        if ($pub->is_recurring && $pub->recurrenceSettings) {
            $settings = $pub->recurrenceSettings;
            $this->info("\n--- Recurrence Settings ---");
            $this->info("Type: {$settings->recurrence_type}");
            $this->info("Interval: {$settings->recurrence_interval}");
            $this->info("Days: " . json_encode($settings->recurrence_days));
            $this->info("End Date: " . ($settings->recurrence_end_date ?? 'NULL'));
            $this->info("Accounts: " . json_encode($settings->recurrence_accounts));
        }
        
        // Scheduled posts
        $scheduledPosts = $pub->scheduled_posts()
            ->orderBy('scheduled_at')
            ->get();
        
        $this->info("\n--- Scheduled Posts ({$scheduledPosts->count()}) ---");
        
        if ($scheduledPosts->isEmpty()) {
            $this->warn("No scheduled posts found!");
        } else {
            $original = $scheduledPosts->where('is_recurring_instance', false);
            $recurring = $scheduledPosts->where('is_recurring_instance', true);
            
            $this->info("Original posts: {$original->count()}");
            $this->info("Recurring instances: {$recurring->count()}");
            
            $this->table(
                ['ID', 'Account', 'Platform', 'Scheduled At', 'Status', 'Is Recurring'],
                $scheduledPosts->map(function ($post) {
                    return [
                        $post->id,
                        $post->account_name,
                        $post->platform,
                        $post->scheduled_at->format('Y-m-d H:i:s'),
                        $post->status,
                        $post->is_recurring_instance ? 'Yes' : 'No',
                    ];
                })
            );
        }
        
        // Validation checks
        $this->info("\n--- Validation Checks ---");
        
        $issues = [];
        
        if ($pub->is_recurring && !$pub->scheduled_at) {
            $issues[] = "❌ Recurring publication has no scheduled_at (base date)";
        }
        
        if ($pub->is_recurring && !$pub->recurrenceSettings) {
            $issues[] = "❌ Recurring publication has no recurrence settings";
        }
        
        if ($pub->scheduled_at && $scheduledPosts->isEmpty()) {
            $issues[] = "❌ Has scheduled_at but no scheduled posts";
        }
        
        if ($pub->is_recurring && $recurring->isEmpty() && $pub->recurrenceSettings?->recurrence_end_date) {
            $issues[] = "⚠️  Recurring publication has no recurring instances";
        }
        
        if ($issues) {
            foreach ($issues as $issue) {
                $this->warn($issue);
            }
        } else {
            $this->info("✅ No issues detected");
        }
    }
}
