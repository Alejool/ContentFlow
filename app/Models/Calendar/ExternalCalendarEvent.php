<?php

namespace App\Models\Calendar;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Publications\Publication;

class ExternalCalendarEvent extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'connection_id',
        'publication_id',
        'external_event_id',
        'provider',
    ];

    protected $casts = [
        'synced_at' => 'datetime',
        'last_updated_at' => 'datetime',
    ];

    /**
     * Get the connection that owns the event.
     */
    public function connection(): BelongsTo
    {
        return $this->belongsTo(ExternalCalendarConnection::class, 'connection_id');
    }

    /**
     * Get the publication associated with this event.
     */
    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }
}
