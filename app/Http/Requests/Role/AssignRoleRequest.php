<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class AssignRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by policy
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role_name' => ['required', 'string', 'in:owner,admin,editor,viewer'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'User ID is required.',
            'user_id.exists' => 'The specified user does not exist.',
            'role_name.required' => 'Role name is required.',
            'role_name.in' => 'Invalid role name. Must be one of: owner, admin, editor, viewer.',
        ];
    }
}
