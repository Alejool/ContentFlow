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
    private array $generatedReels
  ) {}

  public function via($notifiable): array
  {
    return ['database', 'broadcast'];
  }

  public function toArray($notifiable): array
  {
    return [
      'type' => 'reels_generated',
      'message' => 'Tus reels han sido generados exitosamente',
      'media_file_id' => $this->mediaFile->id,
      'platforms' => array_keys($this->generatedReels),
      'count' => count($this->generatedReels),
    ];
  }
}
