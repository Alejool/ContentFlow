<?php

namespace App\Models\Approval;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\ApprovalLevel;
use App\Models\User;

class ApprovalStepUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'step_id',
        'user_id',
    ];

    /**
     * Get the approval step.
     */
    public function step(): BelongsTo
    {
        return $this->belongsTo(ApprovalLevel::class, 'step_id');
    }

    /**
     * Get the user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
