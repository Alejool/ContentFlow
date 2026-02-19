<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnboardingState extends Model
{
    protected $fillable = [
        'user_id',
        'tour_completed',
        'tour_skipped',
        'tour_current_step',
        'tour_completed_steps',
        'wizard_completed',
        'wizard_skipped',
        'wizard_current_step',
        'template_selected',
        'template_id',
        'dismissed_tooltips',
        'completed_at',
        'started_at',
    ];

    protected $casts = [
        'tour_completed' => 'boolean',
        'tour_skipped' => 'boolean',
        'tour_completed_steps' => 'array',
        'wizard_completed' => 'boolean',
        'wizard_skipped' => 'boolean',
        'template_selected' => 'boolean',
        'dismissed_tooltips' => 'array',
        'completed_at' => 'datetime',
        'started_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isComplete(): bool
    {
        return $this->tour_completed || $this->tour_skipped;
    }

    public function getCompletionPercentage(): int
    {
        $total = 3; // tour, wizard, template
        $completed = 0;
        
        if ($this->tour_completed || $this->tour_skipped) {
            $completed++;
        }
        if ($this->wizard_completed || $this->wizard_skipped) {
            $completed++;
        }
        if ($this->template_selected) {
            $completed++;
        }
        
        return (int) (($completed / $total) * 100);
    }
}
