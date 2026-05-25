<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * FASE 7: Database - Model para auditoría
 */
class PlatformConfigurationAudit extends Model
{
    use HasFactory;

    public $timestamps = true;
    const UPDATED_AT = null; // Immutable audit log

    protected $fillable = [
        'workspace_id',
        'user_id',
        'action',
        'platform_key',
        'config_key',
        'old_value',
        'new_value',
        'reason',
        'notes',
        'ip_address',
    ];

    protected $casts = [
        'old_value' => 'json',
        'new_value' => 'json',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
