<?php

namespace App\Models\Publications;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicationActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'publication_id',
        'user_id',
        'type',
        'details',
    ];

    protected $casts = [
        'details' => 'array',
    ];

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
