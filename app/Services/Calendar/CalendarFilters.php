<?php

namespace App\Services\Calendar;

use Illuminate\Database\Eloquent\Builder;

class CalendarFilters
{
    public array $platforms = [];
    public array $campaigns = [];
    public array $statuses = [];

    public function __construct(array $filters = [])
    {
        $this->platforms = $filters['platforms'] ?? [];
        $this->campaigns = $filters['campaigns'] ?? [];
        $this->statuses = $filters['statuses'] ?? [];
    }

    /**
     * Apply filters to a query builder
     */
    public function apply(Builder $query): Builder
    {
        // Apply platform filter
        if (!empty($this->platforms)) {
            $query->where(function ($q) {
                foreach ($this->platforms as $platform) {
                    $q->orWhereJsonContains('platforms', $platform);
                }
            });
        }

        // Apply campaign filter
        if (!empty($this->campaigns)) {
            $query->whereIn('campaign_id', $this->campaigns);
        }

        // Apply status filter
        if (!empty($this->statuses)) {
            $query->whereIn('status', $this->statuses);
        }

        return $query;
    }

    /**
     * Check if any filters are active
     */
    public function isEmpty(): bool
    {
        return empty($this->platforms) && 
               empty($this->campaigns) && 
               empty($this->statuses);
    }

    /**
     * Get filter summary for logging/debugging
     */
    public function getSummary(): array
    {
        return [
            'platforms' => $this->platforms,
            'campaigns' => $this->campaigns,
            'statuses' => $this->statuses,
            'is_empty' => $this->isEmpty(),
        ];
    }
}
