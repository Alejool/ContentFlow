<?php

namespace App\Notifications;

use App\Models\SocialPostLog;
use App\Notifications\BaseNotification;

class VideoDeletedNotification extends BaseNotification
{
    protected string $priority = self::PRIORITY_NORMAL;
    protected string $category = self::CATEGORY_APPLICATION;

    public function __construct(
        protected SocialPostLog $log
    ) {
        $this->platform = strtolower($this->log->platform);
    }

    public function toArray($notifiable): array
    {
        $publication = $this->log->publication;

        return [
            'title' => 'Video Deleted',
            'message' => "Video removed from {$this->getPlatformName($this->platform)}",
            'description' => $publication ? $publication->title : 'Untitled',
            'status' => 'info',
            'icon' => $this->getPlatformIcon($this->platform),
            'publication_id' => $this->log->publication_id,
            'platform_post_id' => $this->log->platform_post_id,
        ];
    }
}
