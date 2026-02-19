<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicationTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'category',
        'preview_image',
        'content',
        'is_active',
        'usage_count',
    ];

    protected $casts = [
        'content' => 'array',
        'is_active' => 'boolean',
    ];

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }
}
