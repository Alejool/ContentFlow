<?php

namespace App\Notifications\Publication;

use App\Notifications\BaseNotification;
use App\Models\Publications\Publication;
use App\Channels\System\CustomDiscordChannel;
use App\Channels\System\CustomSlackChannel;
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
    
    // If notifiable is a User, load currentWorkspace if not already loaded
    if ($notifiable instanceof \App\Models\User) {
      if (!$notifiable->relationLoaded('currentWorkspace')) {
        $notifiable->load('currentWorkspace');
      }
      return $notifiable->currentWorkspace;
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
      
      // Get platform status to include URLs
      $platformStatus = $this->publication->platform_status_summary;
      
      foreach ($this->successPlatforms as $platform) {
        $description .= "  • " . ucfirst($platform);
        
        // Find the URL for this platform
        $platformUrl = null;
        foreach ($platformStatus as $status) {
          if (strtolower($status['platform']) === strtolower($platform) && !empty($status['url'])) {
            $platformUrl = $status['url'];
            break;
          }
        }
        
        if ($platformUrl) {
          $description .= " - " . $platformUrl;
        }
        
        $description .= "\n";
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
    
    $description .= "Fecha: " . now()->format('d/m/Y') . "\n";
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
