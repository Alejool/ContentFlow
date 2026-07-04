<?php

namespace App\Http\Requests\ApprovalWorkflow;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkflowRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => 'required|string|max:255',
      'is_multi_level' => 'sometimes|boolean',
      'steps' => 'required|array|min:1',
      'steps.*.role_id' => 'nullable|exists:roles,id',
      'steps.*.user_id' => 'nullable|exists:users,id',
      'steps.*.name' => 'nullable|string|max:255',
    ];
  }
}
