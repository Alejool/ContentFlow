<?php

namespace App\Notifications;

use App\Channels\ExtendedDatabaseChannel;
use App\Models\SocialPostLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VideoDeletedNotification extends Notification
{
    use Queueable;

    protected $log;

    /**
     * Create a new notification instance.
     */
    public function __construct(SocialPostLog $log)
    {
        $this->log = $log;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [ExtendedDatabaseChannel::class];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $publication = $this->log->publication;
        $thumbnailUrl = null;

        if ($publication) {
            $media = $publication->mediaFiles->first();
            if ($media) {
                // Try to find a thumbnail derivative
                $thumb = $media->derivatives()
                    ->where('derivative_type', 'thumbnail')
                    ->first();

                $path = $thumb ? $thumb->file_path : $media->file_path;

                try {
                    $thumbnailUrl = \Illuminate\Support\Facades\Storage::url($path);
                    if (config('filesystems.default') === 's3') {
                        $thumbnailUrl = \Illuminate\Support\Facades\Storage::temporaryUrl($path, now()->addMinutes(120));
                    }
                } catch (\Exception $e) {
                    $thumbnailUrl = null;
                }
            }
        }

        return [
            'message' => "Video deleted successfully from {$this->log->platform}",
            'title' => 'Video Deleted',
            'status' => 'success', // or 'deleted'? keeping success for notification type
            'platform' => $this->log->platform,
            'category' => 'application',
            'publication_id' => $this->log->publication_id,
            'publication_title' => $publication ? $publication->title : 'Untitled',
            'thumbnail_url' => $thumbnailUrl,
        ];
    }

    public function getCategory(): string
    {
        return 'application';
    }

    public function getPublicationId(): ?int
    {
        return $this->log->publication_id;
    }

    public function getSocialPostLogId(): ?int
    {
        return $this->log->id;
    }
}
