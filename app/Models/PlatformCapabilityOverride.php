<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * FASE 7: Database - Model para overrides de capacidades
 */
class PlatformCapabilityOverride extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'plan',
        'user_id',
        'platform_key',
        'capability_key',
        'value_type',
        'value',
        'is_active',
        'effective_from',
        'effective_until',
        'reason',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'effective_from' => 'datetime',
        'effective_until' => 'datetime',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtiene overrides activos
     */
    public static function active()
    {
        return static::where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('effective_from')
                    ->orWhere('effective_from', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('effective_until')
                    ->orWhere('effective_until', '>', now());
            });
    }

    /**
     * Obtiene valor parseado
     */
    public function getParsedValue()
    {
        return match ($this->value_type) {
            'bool' => $this->value === 'true' || $this->value === '1',
            'int' => (int) $this->value,
            'json' => json_decode($this->value, true),
            default => $this->value,
        };
    }

    /**
     * Obtiene override para usuario/plan/workspace
     */
    public static function getOverride(
        string $platformKey,
        string $capabilityKey,
        ?int $userId = null,
        ?string $plan = null,
        ?string $workspaceId = null
    ) {
        $query = static::active()
            ->where('platform_key', $platformKey)
            ->where('capability_key', $capabilityKey);

        // Prioridad: user > plan > workspace > null
        if ($userId) {
            $query = $query->where('user_id', $userId);
        } elseif ($plan) {
            $query = $query->where('plan', $plan);
        } elseif ($workspaceId) {
            $query = $query->where('workspace_id', $workspaceId);
        }

        return $query->first();
    }
}
