<?php

namespace App\Notifications;

use App\Models\Social\SocialPostLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class PublicationResultNotification extends BaseNotification implements ShouldQueue
{
  use Queueable;

  public function __construct(
    protected SocialPostLog $log,
    protected string $status, // 'published' or 'failed'
    protected ?string $error = null
  ) {
    $this->priority = $status === 'failed' ? self::PRIORITY_HIGH : self::PRIORITY_NORMAL;
    $this->platform = strtolower($this->log->platform);
  }

  public function toArray($notifiable): array
  {
    $publication = $this->log->publication;
    $platformName = $this->getPlatformName($this->platform);
    $accountName = $this->log->account_name ?? ($this->log->socialAccount ? $this->log->socialAccount->name : 'Unknown');

    if ($this->status === 'published') {
      $title = "✅ Publication Successful: {$platformName}";
      $message = "The publication \"{$publication->title}\" has been successfully posted to {$platformName} (Account: {$accountName}).";
      if ($this->log->post_url) {
        $message .= "\nView post: {$this->log->post_url}";
      }
    } else {
      $title = "❌ Publication Failed: {$platformName}";
      $message = "Failed to post \"{$publication->title}\" to {$platformName} (Account: {$accountName}).";
      $message .= "\nError: " . ($this->error ?? 'Unknown error');
    }

    return [
      'title' => $title,
      'message' => $message,
      'status' => $this->status === 'published' ? 'success' : 'error',
      'publication_id' => $this->log->publication_id,
      'platform' => $this->platform,
      'account_name' => $accountName,
      'type' => 'publication_result',
    ];
  }
}
