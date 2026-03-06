<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalStep extends Model
{
  use HasFactory;

  protected $fillable = [
    'workflow_id',
    'role_id',
    'user_id',
    'step_order',
    'name',
  ];

  public function workflow()
  {
    return $this->belongsTo(ApprovalWorkflow::class);
  }

  public function role()
  {
    return $this->belongsTo(\App\Models\Role\Role::class);
  }

  public function user()
  {
    return $this->belongsTo(\App\Models\User::class);
  }
}
