<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckPublicationStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'publications:check-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Checks the status of published posts on social platforms (YouTube)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting publication status check...');

        // Get recent published YouTube logs (e.g., last 30 days)
        // We focus on YouTube as other platforms might not have detailed status APIs available this way
        $logs = \App\Models\SocialPostLog::where('platform', 'youtube')
            ->where('status', 'published')
            ->where('published_at', '>=', now()->subDays(30))
            ->with(['socialAccount', 'publication', 'user'])
            ->get();

        $bar = $this->output->createProgressBar(count($logs));
        $bar->start();

        foreach ($logs as $log) {
            try {
                if (!$log->socialAccount || !$log->platform_post_id) {
                    continue;
                }

                $service = new \App\Services\SocialPlatforms\YouTubeService(
                    $log->socialAccount->access_token,
                    $log->socialAccount
                );

                $status = $service->checkVideoStatus($log->platform_post_id);

                if (!$status['exists']) {
                    if ($status['status'] === 'deleted' || $status['status'] === 'not_found') {
                        // Video removed
                        $this->notifyUser($log, 'video_removed', 'Video was removed from YouTube');
                        $log->update(['status' => 'removed_on_platform']);
                    }
                } else {
                    $uploadStatus = $status['uploadStatus'];
                    $rejectionReason = $status['rejectionReason'];
                    $regionRestriction = $status['regionRestriction'];

                    // Check for rejection
                    if ($uploadStatus === 'rejected') {
                        $this->notifyUser($log, 'rejected', "Video rejected: " . ucfirst($rejectionReason ?? 'Unknown reason'));
                        $log->update([
                            'status' => 'rejected',
                            'error_message' => "Rejected: $rejectionReason"
                        ]);
                    }

                    // Check for copyright/contentID claims (often visible via region restrictions or specific status)
                    // Note: API might not explicitly say "copyright claim" in public detailed status, 
                    // but region restrictions are a strong indicator.
                    if (!empty($regionRestriction)) {
                        // Avoid spamming notifications?
                        // We can store metadata to check if we already notified
                        $meta = $log->post_metadata ?? [];
                        if (empty($meta['restriction_notified'])) {
                            $this->notifyUser($log, 'restricted', 'Video has region restrictions (possible copyright claim)');
                            $meta['restriction_notified'] = true;
                            $log->update(['post_metadata' => $meta]);
                        }
                    }
                }
            } catch (\Exception $e) {
                $this->error("Error checking log {$log->id}: " . $e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Status check completed.');
    }

    private function notifyUser($log, $status, $message)
    {
        if ($log->user) {
            $log->user->notify(new \App\Notifications\PublicationStatusUpdate($log, [
                'status' => $status,
                'message' => $message,
                'details' => ['platform_post_id' => $log->platform_post_id]
            ]));
            $this->info(" Notified user {$log->user->id} about {$status}");
        }
    }
}
