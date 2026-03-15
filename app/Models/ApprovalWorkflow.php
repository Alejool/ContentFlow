<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ApprovalLevel;
use App\Models\Workspace\Workspace;

class ApprovalWorkflow extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'name',
        'is_active',
        'is_enabled',
        'is_multi_level',
        'was_multi_level',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_enabled' => 'boolean',
        'is_multi_level' => 'boolean',
        'was_multi_level' => 'boolean',
    ];

    /**
     * Get the workspace that owns this approval workflow.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Get the approval steps for this workflow (legacy).
     */
    public function steps(): HasMany
    {
        return $this->hasMany(ApprovalLevel::class, 'approval_workflow_id')->orderBy('level_number');
    }

    /**
     * Get the approval levels for this workflow.
     */
    public function levels(): HasMany
    {
        return $this->hasMany(ApprovalLevel::class, 'approval_workflow_id')->orderBy('level_number');
    }

    /**
     * Check if this is a simple workflow (not multi-level).
     */
    public function isSimpleWorkflow(): bool
    {
        return !$this->is_multi_level;
    }

    /**
     * Get the maximum level number in this workflow.
     */
    public function getMaxLevel(): int
    {
        return $this->levels()->max('level_number') ?? 0;
    }

    /**
     * Get an approval level by its number.
     */
    public function getLevelByNumber(int $number): ?ApprovalLevel
    {
        return $this->levels()->where('level_number', $number)->first();
    }
}
