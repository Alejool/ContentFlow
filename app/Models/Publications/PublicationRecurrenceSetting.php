<?php

namespace App\Models\Publications;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicationRecurrenceSetting extends Model
{
    protected $fillable = [
        'publication_id',
        'recurrence_type',
        'recurrence_interval',
        'recurrence_days',
        'recurrence_end_date',
        'recurrence_accounts',
    ];

    protected $casts = [
        'publication_id' => 'integer',
        'recurrence_interval' => 'integer',
        'recurrence_days' => 'array',
        'recurrence_end_date' => 'date',
        'recurrence_accounts' => 'array',
    ];

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }
}
