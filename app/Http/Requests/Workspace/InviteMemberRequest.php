<?php

namespace App\Http\Requests\Workspace;

use Illuminate\Foundation\Http\FormRequest;

class InviteMemberRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'email' => 'required|email|exists:users,email',
      'role_id' => 'required|exists:roles,id',
    ];
  }

  public function messages(): array
  {
    return [
      'email.exists' => __('passwords.workspace_email_not_found'),
      'role_id.required' => __('passwords.workspace_role_required'),
    ];
  }
}
