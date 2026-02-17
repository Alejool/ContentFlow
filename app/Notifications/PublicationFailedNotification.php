<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;
use App\Channels\CustomDiscordChannel;
use App\Channels\CustomSlackChannel;
use App\Models\Workspace\Workspace;
use Illuminate\Notifications\Messages\MailMessage;

class PublicationFailedNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_HIGH;
  protected string $category = self::CATEGORY_APPLICATION;

  public function __construct(
    protected $publication,
    protected string $platformName,
    protected string $errorMessage
  ) {
    $this->platform = strtolower($platformName);
  }

  public function via($notifiable): array
  {
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

  public function toMail($notifiable)
  {
    $platformName = $this->getPlatformName($this->platform);
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

    return (new MailMessage)
      ->subject(trans('notifications.failed.subject', ['platform' => $platformName], $locale))
      ->view('emails.notification', [
        'title' => trans('notifications.failed.title', [], $locale),
        'level' => 'error',
        'introLines' => [
          trans('notifications.failed.intro', [
            'title' => $this->publication->title,
            'platform' => $platformName
          ], $locale),
          "<strong>" . trans('notifications.failed.error_label', [], $locale) . "</strong> {$this->errorMessage}"
        ],
        'actionText' => trans('notifications.failed.action', [], $locale),
        'actionUrl' => route('api.v1.publications.update', $this->publication->id),
        'outroLines' => [
          trans('notifications.failed.outro', [], $locale)
        ]
      ]);
  }

  public function toArray($notifiable): array
  {
    $platformName = $this->getPlatformName($this->platform);
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();
    $campaign = $this->publication->campaigns->first();
    
    $description = "❌ Fallo al publicar \"{$this->publication->title}\"\n\n";
    $description .= "📱 Plataforma: {$platformName}\n";
    $description .= "📊 Estado: Fallido\n\n";
    $description .= "💡 La publicación no pudo completarse en {$platformName}.\n";
    $description .= "Por favor, verifica la configuración de la cuenta o intenta nuevamente.\n";
    $description .= "Si el problema persiste, contacta a soporte.";

    return [
      'title' => trans('notifications.failed.title', [], $locale),
      'message' => trans('notifications.failed.message_app', ['platform' => $platformName], $locale),
      'description' => $description,
      'status' => 'error',
      'icon' => $this->getPlatformIcon($this->platform),
      'publication_id' => $this->publication->id,
      'publication_title' => $this->publication->title,
      'campaign_id' => $campaign ? $campaign->id : null,
      'campaign_name' => $campaign ? $campaign->name : null,
      'platform' => $platformName,
      'failed_at' => now()->toIso8601String(),
      'action' => $this->createAction(
        trans('notifications.failed.action', [], $locale),
        route('api.v1.publications.update', $this->publication->id)
      ),
    ];
  }
}
