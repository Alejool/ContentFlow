<?php

namespace App\Notifications;

use App\Models\SocialPostLog;
use App\Notifications\BaseNotification;

class VideoUploadedNotification extends BaseNotification
{
    protected string $priority = self::PRIORITY_NORMAL;
    protected string $category = self::CATEGORY_APPLICATION;

    public function __construct(
        protected SocialPostLog $log
    ) {
        // Set platform from log
        $this->platform = strtolower($this->log->platform);
    }

    public function toArray($notifiable): array
    {
        $publication = $this->log->publication;
        $thumbnailUrl = $this->getThumbnailUrl($publication);
        $platformName = $this->getPlatformName($this->platform);
        $account = $this->log->socialAccount;
        $campaign = $publication ? $publication->campaigns->first() : null;

        return [
            'title' => 'Video Uploaded Successfully',
            'message' => trans('notifications.video_uploaded', ['platform' => $platformName], $notifiable->preferredLocale()),
            'description' => $publication ? $publication->title : 'Untitled',
            'status' => 'success',
            'icon' => $this->getPlatformIcon($this->platform),
            'thumbnail_url' => $thumbnailUrl,
            'publication_id' => $this->log->publication_id,
            'campaign_id' => $campaign ? $campaign->id : null,
            'campaign_name' => $campaign ? $campaign->name : null,
            'publication_title' => $publication ? $publication->title : 'Untitled',
            'account_name' => $account ? $account->name : 'Unknown Account',
            'platform_post_id' => $this->log->platform_post_id,
            'action' => $this->createAction(
                trans('notifications.view_publication', [], $notifiable->preferredLocale()),
                route('publications.show', $this->log->publication_id)
            ),
        ];
    }

    protected function getThumbnailUrl($publication): ?string
    {
        if (!$publication) {
            return null;
        }

        $media = $publication->mediaFiles->first();
        if (!$media) {
            return null;
        }

        // Try to find a thumbnail derivative
        $thumb = $media->derivatives()
            ->where('derivative_type', 'thumbnail')
            ->first();

        $path = $thumb ? $thumb->file_path : null;

        // If no derivative, check for a separate image file
        if (!$path) {
            $imageFile = $publication->mediaFiles->where('file_type', 'image')->first();
            $path = $imageFile ? $imageFile->file_path : $media->file_path;
        }

        if (!$path) {
            return null;
        }

        try {
            // Check if it's already a full URL
            if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
                return $path;
            }

            // Generate URL based on storage driver
            if (config('filesystems.default') === 's3') {
                try {
                    return \Illuminate\Support\Facades\Storage::temporaryUrl($path, now()->addMinutes(120));
                } catch (\Exception $e) {
                    return \Illuminate\Support\Facades\Storage::url($path);
                }
            }

            return \Illuminate\Support\Facades\Storage::url($path);
        } catch (\Exception $e) {
            return null;
        }
    }
}
