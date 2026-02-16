<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class PublicationProcessingStartedNotification extends BaseNotification implements ShouldQueue
{
  use Queueable;

  protected string $priority = self::PRIORITY_NORMAL;

  public function __construct(
    protected $publication
  ) {
    $this->category = self::CATEGORY_APPLICATION;
  }

  public function toArray($notifiable): array
  {
    // Determine locale
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

    $title = $locale === 'es' ? '🚀 Publicación Iniciada' : '🚀 Publication Started';
    $message = $locale === 'es'
      ? "Se ha iniciado el proceso de publicación para \"{$this->publication->title}\"."
      : "The publication process for \"{$this->publication->title}\" has started.";

    $description = $locale === 'es'
      ? "Tu contenido está siendo enviado a las plataformas seleccionadas."
      : "Your content is being sent to the selected platforms.";

    return [
      'type' => 'publication_started',
      'title' => $title,
      'message' => $message,
      'description' => $description,
      'status' => 'info',
      'icon' => 'Share2',
      'publication_id' => $this->publication->id,
      'publication_title' => $this->publication->title,
    ];
  }
}
