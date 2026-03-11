<?php

namespace App\Http\Requests\ApprovalWorkflow;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLevelRequest extends FormRequest
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
            'level_name' => ['sometimes', 'string', 'max:100'],
            'role_name' => ['sometimes', 'string', 'in:admin,editor'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'level_name.max' => 'Level name cannot exceed 100 characters.',
            'role_name.in' => 'Role must be either admin or editor.',
        ];
    }
}
