<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use App\Models\Logs\WebhookLog;
use App\Models\Workspace\Workspace;

class CustomSlackChannel
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
    
    // Use description if available (contains detailed info), otherwise use message
    $content = $data['description'] ?? $data['message'] ?? '';
    $message = "*" . ($data['title'] ?? 'Notification') . "*\n" . $content;

    // Get workspace for logging
    $workspace = $this->getWorkspace($notifiable);

    try {
      // Send the webhook
      $response = Http::timeout(10)
        ->withoutVerifying()
        ->post($url, [
          'text' => $message,
        ]);

      $success = $response->successful() && $response->body() === 'ok';
      $responseBody = $response->body();
      $statusCode = $response->status();

      // Log the attempt
      if ($workspace) {
        WebhookLog::create([
          'workspace_id' => $workspace->id,
          'channel' => 'slack',
          'event_type' => class_basename($notification),
          'payload' => [
            'text' => $message,
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
          'channel' => 'slack',
          'event_type' => class_basename($notification),
          'payload' => [
            'text' => $message,
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
      return $notifiable->slack_webhook_url;
    }

    if (isset($notifiable->currentWorkspace)) {
      return $notifiable->currentWorkspace->slack_webhook_url;
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
