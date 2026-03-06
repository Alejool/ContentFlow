<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ApprovalStep;

class ApprovalWorkflow extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function workspace()
    {
        return $this->belongsTo(\App\Models\Workspace\Workspace::class);
    }

    public function steps()
    {
        return $this->hasMany(ApprovalStep::class, 'workflow_id')->orderBy('step_order');
    }
}
