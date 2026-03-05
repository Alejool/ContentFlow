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
        'user_calendar_event_id',
        'external_event_id',
        'provider',
    ];

    protected $casts = [
        'synced_at' => 'datetime',
        'last_updated_at' => 'datetime',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Validate that at least one of publication_id or user_calendar_event_id is set
        static::creating(function ($model) {
            if (empty($model->publication_id) && empty($model->user_calendar_event_id)) {
                throw new \InvalidArgumentException(
                    'ExternalCalendarEvent must have either publication_id or user_calendar_event_id'
                );
            }
        });

        static::updating(function ($model) {
            if (empty($model->publication_id) && empty($model->user_calendar_event_id)) {
                throw new \InvalidArgumentException(
                    'ExternalCalendarEvent must have either publication_id or user_calendar_event_id'
                );
            }
        });
    }

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

    /**
     * Get the user calendar event associated with this event.
     */
    public function userCalendarEvent(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User\UserCalendarEvent::class, 'user_calendar_event_id');
    }
}
