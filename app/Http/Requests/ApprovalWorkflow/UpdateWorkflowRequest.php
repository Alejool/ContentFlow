<?php

namespace App\Http\Requests\ApprovalWorkflow;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkflowRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => 'sometimes|string|max:255',
      'is_multi_level' => 'sometimes|boolean',
      'steps' => 'sometimes|array|min:1',
      'steps.*.role_id' => 'nullable|exists:roles,id',
      'steps.*.user_id' => 'nullable|exists:users,id',
      'steps.*.name' => 'nullable|string|max:255',
      'is_enabled' => 'sometimes|boolean',
      'is_active' => 'sometimes|boolean', // Keep for backward compatibility
    ];
  }
}
