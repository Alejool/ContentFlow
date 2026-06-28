<?php

namespace App\Models\Integrations;

use App\Models\Workspace\Workspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IntegrationEventSubscription extends Model
{
    protected $fillable = [
        'workspace_id',
        'channel_type',
        'channel_name',
        'event_type',
        'config',
        'is_active',
    ];

    protected $casts = [
        'config'    => 'array',
        'is_active' => 'boolean',
        'last_triggered_at' => 'datetime',
    ];

    // ── Supported channel types ───────────────────────────────────────────────
    const CHANNEL_DISCORD  = 'discord';
    const CHANNEL_SLACK    = 'slack';
    const CHANNEL_TELEGRAM = 'telegram';
    const CHANNEL_TEAMS    = 'teams';
    const CHANNEL_WEBHOOK  = 'webhook';
    const CHANNEL_EMAIL    = 'email';

    public static function supportedChannels(): array
    {
        return [
            self::CHANNEL_DISCORD  => ['label' => 'Discord',           'icon' => 'discord',     'color' => '#5865F2'],
            self::CHANNEL_SLACK    => ['label' => 'Slack',             'icon' => 'slack',       'color' => '#4A154B'],
            self::CHANNEL_TELEGRAM => ['label' => 'Telegram',          'icon' => 'send',        'color' => '#26A5E4'],
            self::CHANNEL_TEAMS    => ['label' => 'Microsoft Teams',   'icon' => 'users',       'color' => '#6264A7'],
            self::CHANNEL_WEBHOOK  => ['label' => 'Custom Webhook',    'icon' => 'webhook',     'color' => '#64748b'],
            self::CHANNEL_EMAIL    => ['label' => 'Email',             'icon' => 'mail',        'color' => '#10b981'],
        ];
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function deliveryLogs(): HasMany
    {
        return $this->hasMany(IntegrationDeliveryLog::class, 'subscription_id');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }

    public function scopeForEvent($q, string $eventType)
    {
        return $q->where('event_type', $eventType);
    }

    public function scopeForWorkspace($q, int $workspaceId)
    {
        return $q->where('workspace_id', $workspaceId);
    }
}
