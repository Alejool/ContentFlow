<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Workspace\Workspace;

class ExportLog extends Model
{
    protected $fillable = [
        'workspace_id',
        'user_id',
        'export_type',
        'rows_exported',
        'file_path',
        'status',
    ];

    protected $casts = [
        'rows_exported' => 'integer',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log a successful export.
     */
    public static function logExport(
        Workspace $workspace,
        User $user,
        string $exportType,
        int $rowsExported,
        ?string $filePath = null
    ): self {
        return self::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'export_type' => $exportType,
            'rows_exported' => $rowsExported,
            'file_path' => $filePath,
            'status' => 'completed',
        ]);
    }
}
