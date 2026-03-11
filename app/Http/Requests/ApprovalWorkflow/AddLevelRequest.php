<?php

namespace App\Http\Requests\ApprovalWorkflow;

use Illuminate\Foundation\Http\FormRequest;

class AddLevelRequest extends FormRequest
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
            'level_number' => ['required', 'integer', 'min:1', 'max:5'],
            'level_name' => ['required', 'string', 'max:100'],
            'role_name' => ['required', 'string', 'in:admin,editor'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'level_number.required' => 'Level number is required.',
            'level_number.min' => 'Level number must be at least 1.',
            'level_number.max' => 'Level number cannot exceed 5.',
            'level_name.required' => 'Level name is required.',
            'level_name.max' => 'Level name cannot exceed 100 characters.',
            'role_name.required' => 'Role name is required.',
            'role_name.in' => 'Role must be either admin or editor.',
        ];
    }
}
