<?php

namespace App\Models\User;
use Illuminate\Database\Eloquent\Model;

use App\Models\Workspace\Workspace;

class UserCalendarEvent extends Model
{
    protected $fillable = [
        'user_id',
        'workspace_id',
        'title',
        'description',
        'start_date',
        'end_date',
        'color',
        'remind_at',
        'notification_sent',
        'is_public',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'remind_at' => 'datetime',
        'notification_sent' => 'boolean',
        'is_public' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }
}
