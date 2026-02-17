<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;
use App\Models\Publications\Publication;
use App\Channels\CustomDiscordChannel;
use App\Channels\CustomSlackChannel;
use App\Models\Workspace\Workspace;
use Illuminate\Notifications\Messages\MailMessage;

class PublicationPublishedNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_NORMAL;
  protected string $category = self::CATEGORY_APPLICATION;

  public function __construct(
    protected Publication $publication,
    protected array $successPlatforms = [],
    protected array $failedPlatforms = []
  ) {
    $this->category = self::CATEGORY_APPLICATION;
  }

  public function via($notifiable): array
  {
    $channels = ['database', 'broadcast'];
    
    $workspace = $this->getWorkspace($notifiable);
    if ($workspace) {
      if ($workspace->discord_webhook_url) {
        $channels[] = CustomDiscordChannel::class;
      }
      if ($workspace->slack_webhook_url) {
        $channels[] = CustomSlackChannel::class;
      }
    }
    
    return $channels;
  }
  
  protected function getWorkspace($notifiable)
  {
    if ($notifiable instanceof Workspace) {
      return $notifiable;
    }
    
    if (isset($notifiable->currentWorkspace)) {
      return $notifiable->currentWorkspace;
    }
    
    return null;
  }

  public function toArray($notifiable): array
  {
    $locale = method_exists($notifiable, 'preferredLocale') 
      ? $notifiable->preferredLocale() 
      : app()->getLocale();
    
    $campaign = $this->publication->campaigns->first();
    
    $successCount = count($this->successPlatforms);
    $failedCount = count($this->failedPlatforms);
    
    // Build detailed description
    $description = "✅ Publicación completada: \"{$this->publication->title}\"\n\n";
    
    if ($successCount > 0) {
      $description .= "📱 Publicado exitosamente en:\n";
      foreach ($this->successPlatforms as $platform) {
        $description .= "  • " . ucfirst($platform) . "\n";
      }
      $description .= "\n";
    }
    
    if ($failedCount > 0) {
      $description .= "❌ Falló en:\n";
      foreach ($this->failedPlatforms as $pf) {
        $description .= "  • {$pf['platform']}: {$pf['error']}\n";
      }
      $description .= "\n";
    }
    
    $description .= "Fecha y hora: " . now()->format('d/m/Y - h:i A') . "\n";
    $description .= "Estado: " . ($failedCount > 0 ? 'Completado con errores' : 'Completado exitosamente');

    return [
      'title' => $locale === 'es' ? '✅ Publicación Completada' : '✅ Publication Completed',
      'message' => $locale === 'es'
        ? "La publicación \"{$this->publication->title}\" ha sido procesada."
        : "The publication \"{$this->publication->title}\" has been processed.",
      'description' => $description,
      'status' => $failedCount > 0 ? 'warning' : 'success',
      'icon' => 'CheckCircle',
      'publication_id' => $this->publication->id,
      'publication_title' => $this->publication->title,
      'campaign_id' => $campaign ? $campaign->id : null,
      'campaign_name' => $campaign ? $campaign->name : null,
      'completed_at' => now()->toIso8601String(),
      'success_platforms' => $this->successPlatforms,
      'failed_platforms' => $this->failedPlatforms,
      'action' => $this->createAction(
        $locale === 'es' ? 'Ver Publicación' : 'View Publication',
        route('api.v1.publications.show', $this->publication->id)
      ),
    ];
  }
}
