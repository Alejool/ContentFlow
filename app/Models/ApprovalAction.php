<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Publications\Publication;
use App\Models\User;

class ApprovalAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'content_id',
        'user_id',
        'action_type',
        'approval_level',
        'comment',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    // Action type constants
    public const ACTION_SUBMITTED = 'submitted';
    public const ACTION_APPROVED = 'approved';
    public const ACTION_REJECTED = 'rejected';
    public const ACTION_REASSIGNED = 'reassigned';
    public const ACTION_AUTO_ADVANCED = 'auto_advanced';
    public const ACTION_MANUAL_RESOLUTION = 'manual_resolution';

    /**
     * Get the content (publication) that this action belongs to.
     */
    public function content(): BelongsTo
    {
        return $this->belongsTo(Publication::class, 'content_id');
    }

    /**
     * Get the user who performed this action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter actions for a specific content.
     */
    public function scopeForContent(Builder $query, Publication $content): Builder
    {
        return $query->where('content_id', $content->id);
    }

    /**
     * Scope to filter actions by type.
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('action_type', $type);
    }
}
