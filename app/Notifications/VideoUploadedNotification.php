<?php

namespace App\Notifications;

use App\Channels\ExtendedDatabaseChannel;
use App\Models\SocialPostLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VideoUploadedNotification extends Notification implements ShouldQueue
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
        $channels = [ExtendedDatabaseChannel::class];

        // Only broadcast when Redis or Reverb is configured
        $broadcastDriver = config('broadcasting.default');
        if (in_array($broadcastDriver, ['redis', 'reverb'])) {
            $channels[] = 'broadcast';
        }

        return $channels;
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

                $path = $thumb ? $thumb->file_path : null;

                // If no derivative, check for a separate image file in the publication
                if (!$path) {
                    $imageFile = $publication->mediaFiles->where('file_type', 'image')->first();
                    if ($imageFile) {
                        $path = $imageFile->file_path;
                    } else {
                        $path = $media->file_path; // Fallback
                    }
                }

                // Generate URL
                if ($path) {
                    try {
                        // Check if it's already a full URL (S3 public)
                        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
                            $thumbnailUrl = $path;
                        } else {
                            $thumbnailUrl = \Illuminate\Support\Facades\Storage::url($path);
                            // If using S3 and private, might need temporaryUrl
                            if (config('filesystems.default') === 's3') {
                                try {
                                    $thumbnailUrl = \Illuminate\Support\Facades\Storage::temporaryUrl($path, now()->addMinutes(120));
                                } catch (\Exception $e) {
                                    $thumbnailUrl = \Illuminate\Support\Facades\Storage::url($path);
                                }
                            }
                        }
                    } catch (\Exception $e) {
                        $thumbnailUrl = null;
                    }
                }
            }
        }

        return [
            'message' => "Video uploaded successfully to {$this->log->platform}",
            'title' => 'Video Uploaded',
            'status' => 'success',
            'platform' => $this->log->platform,
            'category' => 'application',
            'publication_id' => $this->log->publication_id,
            'publication_title' => $publication ? $publication->title : 'Untitled',
            'thumbnail_url' => $thumbnailUrl,
            'platform_post_id' => $this->log->platform_post_id,
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
