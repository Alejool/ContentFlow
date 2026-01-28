<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class SocialAccountDisconnectedNotification extends BaseNotification
{
  protected string $priority = self::PRIORITY_NORMAL;
  protected string $category = self::CATEGORY_APPLICATION;

  public function __construct(
    protected string $platformName,
    protected string $accountName,
    protected int $orphanedPostsCount = 0,
    protected array $orphanedPostsList = []
  ) {
    $this->platform = strtolower($platformName);

    // Si hay publicaciones huérfanas, aumentar prioridad a ALTA
    // Pero sigue siendo una acción de APLICACIÓN (no del sistema)
    if ($this->orphanedPostsCount > 0) {
      $this->priority = self::PRIORITY_HIGH;
    }
  }

  public function toArray($notifiable): array
  {
    $platformName = $this->getPlatformName($this->platform);
    $locale = method_exists($notifiable, 'preferredLocale') ? $notifiable->preferredLocale() : app()->getLocale();

    $message = trans('notifications.social_account_disconnected', ['platform' => $platformName], $locale);

    if ($this->orphanedPostsCount > 0) {
      $message .= ". {$this->orphanedPostsCount} publicaciones quedaron huérfanas y no podrán ser eliminadas automáticamente.";
    }

    return [
      'title' => 'Cuenta Desconectada',
      'message' => $message,
      'description' => $this->orphanedPostsCount > 0
        ? "Deberás eliminar manualmente las publicaciones desde {$platformName}"
        : "Cuenta: {$this->accountName}",
      'status' => $this->orphanedPostsCount > 0 ? 'warning' : 'info',
      'icon' => $this->getPlatformIcon($this->platform),
      'account_name' => $this->accountName,
      'orphaned_count' => $this->orphanedPostsCount,
      'orphaned_posts_list' => $this->orphanedPostsList,
      'timestamp' => now()->toIso8601String(),
    ];
  }
}
