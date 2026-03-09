<?php

namespace App\Models\Publications;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Workspace\Workspace;
use App\Models\User;

class HashtagLibrary extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'user_id',
        'name',
        'hashtags',
        'category',
        'usage_count',
        'is_favorite',
    ];

    protected $casts = [
        'hashtags' => 'array',
        'usage_count' => 'integer',
        'is_favorite' => 'boolean',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    public function scopeFavorites($query)
    {
        return $query->where('is_favorite', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}
