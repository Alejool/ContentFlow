<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Social\SocialPostLog;
use App\Services\SocialPlatforms\YouTubeService;
use App\Notifications\PublicationStatusUpdate;

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
        $logs = SocialPostLog::where('platform', 'youtube')
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

                $service = new YouTubeService(
                    $log->socialAccount->access_token,
                    $log->socialAccount
                );

                $status = $service->checkVideoStatus($log->platform_post_id);

                if (!$status['exists']) {
                    if ($status['status'] === 'deleted' || $status['status'] === 'not_found') {
                        // Video removed
                        $log->update(['status' => 'removed_on_platform']);
                        if ($log->publication) {
                            $log->publication->update(['status' => 'failed']);
                        }
                        $this->notifyUser($log, 'video_removed', 'Video was removed from YouTube');
                    }
                } else {
                    $uploadStatus = $status['uploadStatus'];
                    $rejectionReason = $status['rejectionReason'];
                    $regionRestriction = $status['regionRestriction'];

                    // Check for rejection or failure
                    if ($uploadStatus === 'rejected' || $uploadStatus === 'failed') {
                        $videoId = $log->platform_post_id;
                        $deletionAttempted = false;
                        $deletionSuccessful = false;

                        // Attempt auto-deletion to prevent duplicate references
                        if ($videoId) {
                            $this->info(" Attempting auto-deletion of $uploadStatus video: $videoId");
                            $deletionAttempted = true;
                            try {
                                $deletionSuccessful = $service->deletePost($videoId);
                            } catch (\Exception $e) {
                                $this->error("  Deletion failed: " . $e->getMessage());
                            }
                        }

                        $log->update([
                            'status' => 'rejected',
                            'error_message' => "Rejected/Failed on YouTube: $rejectionReason"
                        ]);

                        if ($log->publication) {
                            $log->publication->update(['status' => 'failed']);
                        }

                        $msg = "Video rechazado/fallido en YouTube: " . ucfirst($rejectionReason ?? 'Razón desconocida');
                        if ($deletionAttempted) {
                            if ($deletionSuccessful) {
                                $msg .= " (Video eliminado automáticamente de YouTube para evitar duplicados).";
                            } else {
                                $msg .= " (IMPORTANTE: No se pudo eliminar el video automáticamente. Por favor, elimínalo manualmente de YouTube antes de reintentar).";
                            }
                        }

                        $this->notifyUser($log, 'rejected', $msg);
                    }
                    // If processed, we could update status to published if it wasn't already,
                    // but these logs are already filtered by status=published.

                    // Check for copyright/contentID claims (often visible via region restrictions or specific status)
                    if (!empty($regionRestriction)) {
                        $meta = $log->post_metadata ?? [];
                        if (empty($meta['restriction_notified'])) {
                            $this->notifyUser($log, 'restricted', 'Video has region restrictions (possible copyright claim)');
                            $meta['restriction_notified'] = true;
                            $log->update(['post_metadata' => $meta]);

                            // Optionally mark publication as failed or warning?
                            // User said "actualice a failed", so let's do it for consistency if restricted.
                            if ($log->publication) {
                                $log->publication->update(['status' => 'failed']);
                            }
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
            $log->user->notify(new PublicationStatusUpdate($log, [
                'status' => $status,
                'message' => $message,
                'details' => ['platform_post_id' => $log->platform_post_id]
            ]));
            $this->info(" Notified user {$log->user->id} about {$status}");
        }
    }
}
