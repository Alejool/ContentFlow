<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * FASE 7: Database - Model para PlatformConfiguration
 */
class PlatformConfiguration extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'platform_key',
        'config_key',
        'value',
        'is_active',
        'version',
        'description',
        'effective_from',
        'effective_until',
    ];

    protected $casts = [
        'value' => 'json',
        'is_active' => 'boolean',
        'effective_from' => 'datetime',
        'effective_until' => 'datetime',
    ];

    /**
     * Relación: Workspace
     */
    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Obtiene configuraciones activas
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
     * Obtiene configuraciones por plataforma
     */
    public static function forPlatform(string $platformKey)
    {
        return static::where('platform_key', $platformKey);
    }

    /**
     * Obtiene configuración específica
     */
    public static function getConfig(
        string $platformKey,
        string $configKey,
        ?string $workspaceId = null,
        $default = null
    ) {
        $query = static::active()
            ->forPlatform($platformKey)
            ->where('config_key', $configKey);

        if ($workspaceId) {
            $query = $query->where(function ($q) use ($workspaceId) {
                $q->where('workspace_id', $workspaceId)
                    ->orWhereNull('workspace_id');
            })
            ->orderBy('workspace_id', 'desc'); // Workspace-specific primero
        } else {
            $query = $query->whereNull('workspace_id');
        }

        $config = $query->first();

        return $config ? $config->value : $default;
    }

    /**
     * Registra cambio en auditoría
     */
    public static function logChange(
        string $action,
        string $platformKey,
        string $configKey,
        $oldValue,
        $newValue,
        ?string $workspaceId = null,
        ?string $reason = null,
        ?int $userId = null
    ) {
        PlatformConfigurationAudit::create([
            'action' => $action,
            'workspace_id' => $workspaceId,
            'user_id' => $userId ?? auth()->id(),
            'platform_key' => $platformKey,
            'config_key' => $configKey,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'reason' => $reason,
            'ip_address' => request()->ip(),
        ]);
    }
}
