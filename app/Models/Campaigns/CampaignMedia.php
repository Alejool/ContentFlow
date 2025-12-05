<?php

namespace App\Models\Campaigns;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Campaigns\Campaign;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class CampaignMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'media_file_id',
        'order',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function mediaFile(): BelongsTo
    {
        return $this->belongsTo(\App\Models\MediaFile::class);
    }
}
