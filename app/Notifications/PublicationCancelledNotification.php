<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;
use App\Models\Publications\Publication;
use App\Channels\CustomDiscordChannel;
use App\Channels\CustomSlackChannel;
use App\Models\Workspace\Workspace;
use Illuminate\Notifications\Messages\MailMessage;

class PublicationCancelledNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_NORMAL;
  protected string $category = self::CATEGORY_APPLICATION;
  
  public function __construct(
    protected Publication $publication
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
    
    $description = "⚠️ Publicación cancelada: \"{$this->publication->title}\"\n\n";
    $description .= "📊 Estado: Cancelado\n\n";
    $description .= "💡 La publicación fue cancelada por el usuario.\n";
    $description .= "Los trabajos en cola han sido detenidos.";

    return [
      'title' => 'Publicación cancelada',
      'message' => "La publicación \"{$this->publication->title}\" fue cancelada",
      'description' => $description,
      'status' => 'warning',
      'icon' => 'XCircle',
      'publication_id' => $this->publication->id,
      'publication_title' => $this->publication->title,
      'campaign_id' => $campaign ? $campaign->id : null,
      'campaign_name' => $campaign ? $campaign->name : null,
      'cancelled_at' => now()->toIso8601String(),
      'action' => $this->createAction(
        'Ver publicación',
        route('api.v1.publications.update', $this->publication->id)
      ),
    ];
  }
}
