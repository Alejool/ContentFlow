<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;
use App\Models\Publications\Publication;
use App\Channels\CustomDiscordChannel;
use App\Channels\CustomSlackChannel;
use App\Models\Workspace\Workspace;
use Illuminate\Notifications\Messages\MailMessage;

class PublicationPostFailedNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_HIGH;
  protected string $category = self::CATEGORY_APPLICATION;

  public function __construct(
    protected Publication $publication,
    protected string $errorMessage,
    protected array $failedPlatforms = []
  ) {
    $this->category = self::CATEGORY_APPLICATION;
  }

  public function via($notifiable): array
  {
    // Solo notificar en la plataforma, no enviar correos
    $channels = ['database', 'broadcast'];
    
    // Add workspace notification channels
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

  public function toMail($notifiable)
  {
    $locale = method_exists($notifiable, 'preferredLocale') 
      ? $notifiable->preferredLocale() 
      : app()->getLocale();

    return (new MailMessage)
      ->subject(trans('notifications.post_failed.subject', [], $locale))
      ->view('emails.notification', [
        'title' => trans('notifications.post_failed.title', [], $locale),
        'level' => 'error',
        'introLines' => [
          trans('notifications.post_failed.intro', [
            'title' => $this->publication->title
          ], $locale),
          "<strong>" . trans('notifications.post_failed.error_label', [], $locale) . "</strong> {$this->errorMessage}"
        ],
        'actionText' => trans('notifications.post_failed.action', [], $locale),
        'actionUrl' => route('api.v1.publications.update', $this->publication->id),
        'outroLines' => [
          trans('notifications.post_failed.outro', [], $locale)
        ]
      ]);
  }

  public function toArray($notifiable): array
  {
    $locale = method_exists($notifiable, 'preferredLocale') 
      ? $notifiable->preferredLocale() 
      : app()->getLocale();
    $campaign = $this->publication->campaigns->first();
    
    $description = "❌ Fallo al publicar \"{$this->publication->title}\"\n\n";
    
    if (!empty($this->failedPlatforms)) {
    $description .= "📱 Plataforma(s): " . implode(', ', array_column($this->failedPlatforms, 'platform')) . "\n";
    }
    
    $description .= "📊 Estado: Fallido\n\n";
    $description .= "💡 La publicación no pudo completarse en la(s) plataforma(s) seleccionada(s).\n";
    $description .= "Por favor, verifica la configuración de la cuenta o intenta nuevamente.\n";
    $description .= "Si el problema persiste, contacta a soporte.";

    return [
      'title' => trans('notifications.post_failed.title', [], $locale),
      'message' => trans('notifications.post_failed.message', [
        'title' => $this->publication->title
      ], $locale),
      'description' => $description,
      'status' => 'error',
      'icon' => 'AlertCircle',
      'publication_id' => $this->publication->id,
      'publication_title' => $this->publication->title,
      'campaign_id' => $campaign ? $campaign->id : null,
      'campaign_name' => $campaign ? $campaign->name : null,
      'failed_at' => now()->toIso8601String(),
      'failed_platforms' => $this->failedPlatforms,
      'action' => $this->createAction(
        trans('notifications.post_failed.action', [], $locale),
        route('api.v1.publications.update', $this->publication->id)
      ),
    ];
  }
}
