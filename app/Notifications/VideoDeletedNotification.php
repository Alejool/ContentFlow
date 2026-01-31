<?php

namespace App\Notifications;

use App\Models\Social\SocialPostLog;

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
        $platformName = $this->getPlatformName($this->platform);
        $account = $this->log->socialAccount;
        $campaign = $publication ? $publication->campaigns->first() : null;

        return [
            'title' => 'Video Deleted',
            'message' => trans('notifications.video_deleted', ['platform' => $platformName], $notifiable->preferredLocale()),
            'description' => $publication ? $publication->title : 'Untitled',
            'status' => 'info',
            'icon' => $this->getPlatformIcon($this->platform),
            'publication_id' => $this->log->publication_id,
            'campaign_id' => $campaign ? $campaign->id : null,
            'campaign_name' => $campaign ? $campaign->name : null,
            'publication_title' => $publication ? $publication->title : 'Untitled',
            'account_name' => $account ? $account->name : 'Unknown Account',
            'platform_post_id' => $this->log->platform_post_id,
        ];
    }
}
