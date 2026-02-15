<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use App\Models\Logs\WebhookLog;
use App\Models\Workspace\Workspace;

class CustomDiscordChannel
{
  /**
   * Send the given notification.
   */
  public function send($notifiable, Notification $notification): void
  {
    // Get the webhook URL
    $url = $this->getWebhookUrl($notifiable);

    if (!$url) {
      return;
    }

    // Get the notification data
    $data = $notification->toArray($notifiable);
    $message = "*" . ($data['title'] ?? 'Notification') . "*\n" . ($data['message'] ?? '');

    // Get workspace for logging
    $workspace = $this->getWorkspace($notifiable);

    try {
      // Send the webhook
      $response = Http::timeout(10)
        ->withoutVerifying()
        ->post($url, [
          'content' => $message,
          'username' => 'ContentFlow Bot',
        ]);

      $success = $response->status() === 204 || ($response->successful() && !str_contains($response->header('Content-Type'), 'text/html'));
      $responseBody = $response->body();
      $statusCode = $response->status();

      // Log the attempt
      if ($workspace) {
        WebhookLog::create([
          'workspace_id' => $workspace->id,
          'channel' => 'discord',
          'event_type' => class_basename($notification),
          'payload' => [
            'content' => $message,
            'url' => $url
          ],
          'response' => $responseBody ?: 'No response body',
          'status_code' => $statusCode,
          'success' => $success,
        ]);
      }
    } catch (\Exception $e) {
      // Log the failure
      if ($workspace) {
        WebhookLog::create([
          'workspace_id' => $workspace->id,
          'channel' => 'discord',
          'event_type' => class_basename($notification),
          'payload' => [
            'content' => $message,
            'url' => $url
          ],
          'response' => "EXCEPTIÓN: " . $e->getMessage(),
          'status_code' => 0,
          'success' => false,
        ]);
      }
    }
  }

  /**
   * Get the webhook URL from the notifiable entity
   */
  protected function getWebhookUrl($notifiable): ?string
  {
    if ($notifiable instanceof Workspace) {
      return $notifiable->discord_webhook_url;
    }

    if (isset($notifiable->currentWorkspace)) {
      return $notifiable->currentWorkspace->discord_webhook_url;
    }

    return null;
  }

  /**
   * Get the workspace from the notifiable entity
   */
  protected function getWorkspace($notifiable): ?Workspace
  {
    if ($notifiable instanceof Workspace) {
      return $notifiable;
    }

    if (isset($notifiable->currentWorkspace)) {
      return $notifiable->currentWorkspace;
    }

    return null;
  }
}
