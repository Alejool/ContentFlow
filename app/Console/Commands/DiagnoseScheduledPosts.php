<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Social\ScheduledPost;
use Illuminate\Support\Facades\DB;

class DiagnoseScheduledPosts extends Command
{
    protected $signature = 'diagnose:scheduled-posts {--workspace_id=}';
    protected $description = 'Diagnose scheduled posts data';

    public function handle()
    {
        $workspaceId = $this->option('workspace_id');
        
        $this->info('=== Scheduled Posts Diagnosis ===');
        $this->newLine();

        $query = ScheduledPost::with('publication');
        
        if ($workspaceId) {
            $query->whereHas('publication', function ($q) use ($workspaceId) {
                $q->where('workspace_id', $workspaceId);
            });
            $this->info("Filtering by workspace_id: {$workspaceId}");
        }

        $posts = $query->get();
        
        $this->info("Total scheduled posts: " . $posts->count());
        $this->newLine();

        // Group by platform
        $byPlatform = $posts->groupBy('platform');
        $this->info('Posts by platform:');
        foreach ($byPlatform as $platform => $items) {
            $this->line("  {$platform}: {$items->count()}");
        }
        $this->newLine();

        // Group by status
        $byStatus = $posts->groupBy('status');
        $this->info('Posts by status:');
        foreach ($byStatus as $status => $items) {
            $this->line("  {$status}: {$items->count()}");
        }
        $this->newLine();

        // Show sample posts
        $this->info('Sample posts (first 5):');
        foreach ($posts->take(5) as $post) {
            $this->line("  ID: {$post->id}");
            $this->line("    Platform: {$post->platform}");
            $this->line("    Status: {$post->status}");
            $this->line("    Scheduled: {$post->scheduled_at}");
            $this->line("    Publication: " . ($post->publication ? $post->publication->title : 'N/A'));
            $this->newLine();
        }

        return 0;
    }
}
