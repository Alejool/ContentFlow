<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SocialAccount extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'platform',
        'account_id',
        'access_token',
        'refresh_token',
        'token_expires_at',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'token_expires_at' => 'timestamp',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scheduledPosts(): HasMany
    {
        return $this->hasMany(ScheduledPost::class);
    }

    public function metrics(): HasMany
    {
        return $this->hasMany(SocialMediaMetrics::class);
    }

    public function getLatestMetrics()
    {
        return $this->metrics()->latest('date')->first();
    }

    public function getFollowerGrowth($days = 30)
    {
        $startDate = now()->subDays($days);
        $metrics = $this->metrics()
            ->where('date', '>=', $startDate)
            ->orderBy('date')
            ->get();

        if ($metrics->count() < 2) {
            return 0;
        }

        $firstFollowers = $metrics->first()->followers;
        $lastFollowers = $metrics->last()->followers;

        return $lastFollowers - $firstFollowers;
    }
}
