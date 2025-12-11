<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Publications\Publication;

class Campaign extends Model
{
    use HasFactory, SoftDeletes;

    private static $status = [
        'active',
        'inactive',
        'completed',
        'deleted',
        'paused',
    ];


    protected $fillable = [
        'user_id',
        'name',
        'description',
        'status',
        'start_date',
        'end_date',
        'goal',
        'budget',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'budget' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function publications(): BelongsToMany
    {
        return $this->belongsToMany(Publication::class, 'campaign_publication')
            ->withPivot('order')
            ->withTimestamps()
            ->orderBy('campaign_publication.order');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', SELF::$status[0]);
    }
    public function scopeInactive($query)
    {
        return $query->where('status', SELF::$status[1]);
    }
    public function scopeCompleted($query)
    {
        return $query->where('status', SELF::$status[2]);
    }
    public function scopeDeleted($query)
    {
        return $query->where('status', SELF::$status[3]);
    }
    public function scopePaused($query)
    {
        return $query->where('status', SELF::$status[4]);
    }


    public function scopeByDateRange($query, $start, $end)
    {
        if ($start && $end) {
            return $query->whereBetween('created_at', [$start, $end]);
        }
        return $query;
    }

    // Accessors
    public function getPublicationCountAttribute()
    {
        return $this->publications()->count();
    }
}
