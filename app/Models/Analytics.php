<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Analytics extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'metric_type',
        'metric_name',
        'metric_value',
        'metric_date',
        'platform',
        'reference_id',
        'reference_type',
        'metadata',
    ];

    protected $casts = [
        'metric_value' => 'decimal:2',
        'metric_date' => 'date',
        'metadata' => 'array',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeByType($query, string $type)
    {
        return $query->where('metric_type', $type);
    }

    public function scopeByPlatform($query, string $platform)
    {
        return $query->where('platform', $platform);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('metric_date', [$startDate, $endDate]);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Helper methods
    public static function getTotalByMetric(string $metricName, int $userId, $startDate = null, $endDate = null)
    {
        $query = self::where('user_id', $userId)
            ->where('metric_name', $metricName);

        if ($startDate && $endDate) {
            $query->whereBetween('metric_date', [$startDate, $endDate]);
        }

        return $query->sum('metric_value');
    }

    public static function getAverageByMetric(string $metricName, int $userId, $startDate = null, $endDate = null)
    {
        $query = self::where('user_id', $userId)
            ->where('metric_name', $metricName);

        if ($startDate && $endDate) {
            $query->whereBetween('metric_date', [$startDate, $endDate]);
        }

        return $query->avg('metric_value');
    }
}
