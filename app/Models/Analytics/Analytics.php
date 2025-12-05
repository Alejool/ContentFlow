<?php

namespace App\Models\Analytics;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }
}
