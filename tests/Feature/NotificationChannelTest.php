<?php

namespace Tests\Feature;

use App\Channels\CustomDiscordChannel;
use App\Channels\CustomSlackChannel;
use App\Models\Workspace\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Illuminate\Notifications\Notification;

class NotificationChannelTest extends TestCase
{
  use RefreshDatabase;

  public function test_discord_channel_rejects_html_response()
  {
    Http::fake([
      'discord.com/api/webhooks/*' => Http::response('<html>Invite</html>', 200, ['Content-Type' => 'text/html']),
    ]);

    $workspace = Workspace::factory()->create([
      'discord_webhook_url' => 'https://discord.com/api/webhooks/12345/abcde',
    ]);

    $notification = \Mockery::mock(Notification::class);
    $notification->shouldReceive('toArray')->andReturn([
      'title' => 'Test',
      'message' => 'Test message'
    ]);

    $channel = new CustomDiscordChannel();
    $channel->send($workspace, $notification);

    $this->assertDatabaseHas('webhook_logs', [
      'workspace_id' => $workspace->id,
      'channel' => 'discord',
      'success' => false,
    ]);
  }

  public function test_slack_channel_rejects_html_response()
  {
    Http::fake([
      'hooks.slack.com/*' => Http::response('<html>Error</html>', 200, ['Content-Type' => 'text/html']),
    ]);

    $workspace = Workspace::factory()->create([
      'slack_webhook_url' => 'https://hooks.slack.com/services/T000/B000/XXXX',
    ]);

    $notification = \Mockery::mock(Notification::class);
    $notification->shouldReceive('toArray')->andReturn([
      'title' => 'Test',
      'message' => 'Test message'
    ]);

    $channel = new CustomSlackChannel();
    $channel->send($workspace, $notification);

    $this->assertDatabaseHas('webhook_logs', [
      'workspace_id' => $workspace->id,
      'channel' => 'slack',
      'success' => false,
    ]);
  }
}
