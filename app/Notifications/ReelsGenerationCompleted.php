<?php

namespace App\Notifications;

use App\Models\MediaFiles\MediaFile;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReelsGenerationCompleted extends Notification implements ShouldQueue
{
  use Queueable;

  public function __construct(
    private MediaFile $mediaFile,
    private array $generatedReels,
    private ?int $publicationId = null
  ) {}

  public function via($notifiable): array
  {
    return ['database', 'broadcast'];
  }

  public function toArray($notifiable): array
  {
    $publication = null;
    $publicationTitle = null;
    
    // Try to get publication info
    if ($this->publicationId) {
      $publication = \App\Models\Publications\Publication::find($this->publicationId);
      if ($publication) {
        $publicationTitle = $publication->title ?? $publication->description;
        // Truncate if too long
        if ($publicationTitle && strlen($publicationTitle) > 50) {
          $publicationTitle = substr($publicationTitle, 0, 47) . '...';
        }
      }
    }

    // Build message
    $platformNames = $this->getPlatformNames(array_keys($this->generatedReels));
    $platformsText = implode(', ', $platformNames);
    
    $message = $publicationTitle 
      ? "Reels generados para '{$publicationTitle}' ({$platformsText})"
      : "Tus reels han sido generados exitosamente para {$platformsText}";

    return [
      'type' => 'reels_generated',
      'message' => $message,
      'media_file_id' => $this->mediaFile->id,
      'publication_id' => $this->publicationId,
      'publication_title' => $publicationTitle,
      'platforms' => array_keys($this->generatedReels),
      'count' => count($this->generatedReels),
    ];
  }

  /**
   * Get friendly platform names
   */
  private function getPlatformNames(array $platforms): array
  {
    $names = [];
    foreach ($platforms as $platform) {
      $names[] = match($platform) {
        'instagram' => 'Instagram',
        'tiktok' => 'TikTok',
        'youtube_shorts' => 'YouTube Shorts',
        default => ucfirst($platform)
      };
    }
    return $names;
  }
}
