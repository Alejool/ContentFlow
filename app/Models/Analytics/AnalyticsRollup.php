<?php

namespace App\Models\Analytics;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AnalyticsRollup extends Model
{
    use HasFactory;

    protected $fillable = [
        'entity_type',
        'entity_id',
        'period_type',
        'period_start',
        'period_end',
        'platform',
        'views',
        'clicks',
        'conversions',
        'reach',
        'impressions',
        'likes',
        'comments',
        'shares',
        'saves',
        'avg_engagement_rate',
        'data_points',
    ];

    protected $casts = [
        'period_start'        => 'date',
        'period_end'          => 'date',
        'views'               => 'integer',
        'clicks'              => 'integer',
        'conversions'         => 'integer',
        'reach'               => 'integer',
        'impressions'         => 'integer',
        'likes'               => 'integer',
        'comments'            => 'integer',
        'shares'              => 'integer',
        'saves'               => 'integer',
        'avg_engagement_rate' => 'decimal:2',
        'data_points'         => 'integer',
    ];

    // Scopes
    public function scopeForEntity($query, string $type, int $id)
    {
        return $query->where('entity_type', $type)->where('entity_id', $id);
    }

    public function scopeForEntities($query, string $type, array $ids)
    {
        return $query->where('entity_type', $type)->whereIn('entity_id', $ids);
    }

    public function scopePeriod($query, string $periodType)
    {
        return $query->where('period_type', $periodType);
    }

    public function scopeDateRange($query, $start, $end)
    {
        return $query->whereBetween('period_start', [$start, $end]);
    }

    // Helper: total engagement for a row
    public function getTotalEngagementAttribute(): int
    {
        return $this->likes + $this->comments + $this->shares + $this->saves;
    }
}
