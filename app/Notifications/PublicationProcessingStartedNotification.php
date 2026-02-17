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
    protected $publication,
    protected array $socialAccounts = []
  ) {
    $this->category = self::CATEGORY_APPLICATION;
  }

  public function toArray($notifiable): array
  {
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

    $title = $locale === 'es' ? 'Publicación Iniciada' : ' Publication Started';
    
    // Build detailed description
    $description = "Publicación: \"{$this->publication->title}\"\n\n";
    
    if (!empty($this->socialAccounts)) {
      $description .= "Plataformas seleccionadas:\n";
      foreach ($this->socialAccounts as $account) {
        $platform = ucfirst($account['platform'] ?? 'Desconocida');
        $accountName = $account['account_name'] ?? 'Sin nombre';
        $description .= "  • {$platform} (@{$accountName})\n";
      }
      $description .= "\n";
    }
    
    $description .= "Hora de inicio: " . now()->format('d/m/Y - h:i A') . "\n";
    $description .= "Estado: Publicando\n\n";
    $description .= "Tu contenido está siendo enviado a las plataformas seleccionadas.\n";
    $description .= "Recibirás una notificación cuando el proceso finalice.";

    return [
      'type' => 'publication_started',
      'title' => $title,
      'message' => $locale === 'es'
        ? "Publicando \"{$this->publication->title}\" en " . count($this->socialAccounts) . " plataforma(s)"
        : "Publishing \"{$this->publication->title}\" to " . count($this->socialAccounts) . " platform(s)",
      'description' => $description,
      'status' => 'info',
      'icon' => 'Share2',
      'publication_id' => $this->publication->id,
      'publication_title' => $this->publication->title,
      'started_at' => now()->toIso8601String(),
      'platforms' => $this->socialAccounts,
    ];
  }
}
