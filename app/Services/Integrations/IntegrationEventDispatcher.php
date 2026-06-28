<?php

namespace App\Services\Integrations;

use App\Models\Integrations\IntegrationDeliveryLog;
use App\Models\Integrations\IntegrationEventSubscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * IntegrationEventDispatcher
 *
 * Delivers a system event to all active integration subscriptions for a workspace.
 * Each channel type has its own delivery strategy. Adding a new channel requires
 * only a new private deliver{Channel}() method — no other changes needed.
 *
 * Usage:
 *   IntegrationEventDispatcher::dispatch(
 *       workspaceId: 42,
 *       eventType:   IntegrationEvents::PUBLICATION_PUBLISHED,
 *       payload:     ['title' => 'My Post', 'url' => 'https://...']
 *   );
 */
class IntegrationEventDispatcher
{
    /**
     * Find all active subscriptions for this workspace+event and deliver to each channel.
     */
    public static function dispatch(int $workspaceId, string $eventType, array $payload = []): void
    {
        $subscriptions = IntegrationEventSubscription::query()
            ->active()
            ->forWorkspace($workspaceId)
            ->forEvent($eventType)
            ->get();

        foreach ($subscriptions as $subscription) {
            $log = IntegrationDeliveryLog::create([
                'workspace_id'    => $workspaceId,
                'subscription_id' => $subscription->id,
                'channel_type'    => $subscription->channel_type,
                'event_type'      => $eventType,
                'payload'         => $payload,
                'status'          => IntegrationDeliveryLog::STATUS_PENDING,
            ]);

            try {
                $result = self::deliver($subscription, $eventType, $payload);

                $log->update([
                    'status'       => IntegrationDeliveryLog::STATUS_DELIVERED,
                    'http_status'  => $result['http_status'] ?? null,
                    'delivered_at' => now(),
                ]);

                $subscription->increment('trigger_count');
                $subscription->update(['last_triggered_at' => now()]);
            } catch (\Throwable $e) {
                $log->update([
                    'status'        => IntegrationDeliveryLog::STATUS_FAILED,
                    'error_message' => $e->getMessage(),
                ]);

                Log::warning('Integration delivery failed', [
                    'subscription_id' => $subscription->id,
                    'channel_type'    => $subscription->channel_type,
                    'event_type'      => $eventType,
                    'error'           => $e->getMessage(),
                ]);
            }
        }
    }

    // ── Channel delivery strategies ───────────────────────────────────────────

    private static function deliver(IntegrationEventSubscription $sub, string $eventType, array $payload): array
    {
        return match ($sub->channel_type) {
            IntegrationEventSubscription::CHANNEL_DISCORD  => self::deliverDiscord($sub, $eventType, $payload),
            IntegrationEventSubscription::CHANNEL_SLACK    => self::deliverSlack($sub, $eventType, $payload),
            IntegrationEventSubscription::CHANNEL_TELEGRAM => self::deliverTelegram($sub, $eventType, $payload),
            IntegrationEventSubscription::CHANNEL_TEAMS    => self::deliverTeams($sub, $eventType, $payload),
            IntegrationEventSubscription::CHANNEL_WEBHOOK  => self::deliverWebhook($sub, $eventType, $payload),
            IntegrationEventSubscription::CHANNEL_EMAIL    => self::deliverEmail($sub, $eventType, $payload),
            default => throw new \InvalidArgumentException("Unknown channel type: {$sub->channel_type}"),
        };
    }

    private static function deliverDiscord(IntegrationEventSubscription $sub, string $eventType, array $payload): array
    {
        $webhookUrl = $sub->config['webhook_url'] ?? null;
        if (!$webhookUrl) throw new \RuntimeException('Discord webhook_url not configured');

        $message = self::buildMessage($eventType, $payload);

        $response = Http::post($webhookUrl, [
            'embeds' => [[
                'title'       => $message['title'],
                'description' => $message['body'],
                'color'       => 0x6366f1,
                'timestamp'   => now()->toIso8601String(),
                'footer'      => ['text' => 'Intellipost'],
            ]],
        ]);

        return ['http_status' => $response->status()];
    }

    private static function deliverSlack(IntegrationEventSubscription $sub, string $eventType, array $payload): array
    {
        $webhookUrl = $sub->config['webhook_url'] ?? null;
        if (!$webhookUrl) throw new \RuntimeException('Slack webhook_url not configured');

        $message = self::buildMessage($eventType, $payload);

        $response = Http::post($webhookUrl, [
            'text'        => "*{$message['title']}*",
            'attachments' => [[
                'text'    => $message['body'],
                'color'   => '#6366f1',
                'footer'  => 'Intellipost',
                'ts'      => time(),
            ]],
        ]);

        return ['http_status' => $response->status()];
    }

    private static function deliverTelegram(IntegrationEventSubscription $sub, string $eventType, array $payload): array
    {
        $botToken = $sub->config['bot_token'] ?? null;
        $chatId   = $sub->config['chat_id'] ?? null;

        if (!$botToken || !$chatId) {
            throw new \RuntimeException('Telegram bot_token and chat_id are required');
        }

        $message = self::buildMessage($eventType, $payload);
        $text = "*{$message['title']}*\n{$message['body']}";

        $response = Http::post("https://api.telegram.org/bot{$botToken}/sendMessage", [
            'chat_id'    => $chatId,
            'text'       => $text,
            'parse_mode' => 'Markdown',
        ]);

        return ['http_status' => $response->status()];
    }

    private static function deliverTeams(IntegrationEventSubscription $sub, string $eventType, array $payload): array
    {
        $webhookUrl = $sub->config['webhook_url'] ?? null;
        if (!$webhookUrl) throw new \RuntimeException('Teams webhook_url not configured');

        $message = self::buildMessage($eventType, $payload);

        $response = Http::post($webhookUrl, [
            '@type'      => 'MessageCard',
            '@context'   => 'http://schema.org/extensions',
            'themeColor' => '6366f1',
            'summary'    => $message['title'],
            'sections'   => [[
                'activityTitle' => $message['title'],
                'activityText'  => $message['body'],
            ]],
        ]);

        return ['http_status' => $response->status()];
    }

    private static function deliverWebhook(IntegrationEventSubscription $sub, string $eventType, array $payload): array
    {
        $url    = $sub->config['url'] ?? null;
        $secret = $sub->config['secret'] ?? null;

        if (!$url) throw new \RuntimeException('Webhook URL not configured');

        $body = [
            'event'     => $eventType,
            'timestamp' => now()->toIso8601String(),
            'payload'   => $payload,
        ];

        $request = Http::withHeaders(['Content-Type' => 'application/json']);

        if ($secret) {
            $signature = hash_hmac('sha256', json_encode($body), $secret);
            $request   = $request->withHeaders(['X-Signature' => $signature]);
        }

        $response = $request->post($url, $body);
        return ['http_status' => $response->status()];
    }

    private static function deliverEmail(IntegrationEventSubscription $sub, string $eventType, array $payload): array
    {
        $to      = $sub->config['email'] ?? null;
        if (!$to) throw new \RuntimeException('Email address not configured');

        $message = self::buildMessage($eventType, $payload);

        \Illuminate\Support\Facades\Mail::raw(
            "{$message['title']}\n\n{$message['body']}",
            fn ($m) => $m->to($to)->subject("[Intellipost] {$message['title']}")
        );

        return ['http_status' => 200];
    }

    // ── Message builder ───────────────────────────────────────────────────────

    private static function buildMessage(string $eventType, array $payload): array
    {
        $titles = [
            'publication.created'    => '📝 New publication created',
            'publication.published'  => '🚀 Publication published',
            'publication.approved'   => '✅ Publication approved',
            'publication.rejected'   => '❌ Publication rejected',
            'publication.failed'     => '⚠️ Publication failed',
            'publication.scheduled'  => '📅 Publication scheduled',
            'approval.submitted'     => '📬 Approval flow started',
            'approval.approved'      => '✅ Approval completed',
            'approval.rejected'      => '❌ Approval rejected',
            'approval.cancelled'     => '🚫 Approval cancelled',
            'approval.auto_advanced' => '⏩ Approval step auto-advanced',
            'user.created'           => '👤 New user joined',
            'user.removed'           => '👤 User removed',
            'user.role_changed'      => '🔄 User role changed',
            'error.critical'         => '🔴 Critical error',
            'security.event'         => '🔐 Security event',
        ];

        $title = $titles[$eventType] ?? "Event: {$eventType}";
        $body  = collect($payload)
            ->except(['password', 'token', 'secret'])
            ->map(fn ($v, $k) => "{$k}: " . (is_array($v) ? json_encode($v) : $v))
            ->implode("\n");

        return ['title' => $title, 'body' => $body ?: '(no details)'];
    }
}
