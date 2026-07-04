<?php

namespace App\Http\Requests\Workspace;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkspaceRoleRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => 'required|string|max:255|unique:roles,name',
      'description' => 'nullable|string|max:1000',
      'permissions' => 'nullable|array',
      'permissions.*' => 'exists:permissions,id',
      'approval_participant' => 'nullable|boolean',
    ];
  }
}
