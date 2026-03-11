<?php

namespace App\Http\Requests\ApprovalWorkflow;

use Illuminate\Foundation\Http\FormRequest;

class ConfigureWorkflowRequest extends FormRequest
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
            'is_multi_level' => ['required', 'boolean'],
            'levels' => ['required_if:is_multi_level,true', 'array', 'min:1', 'max:5'],
            'levels.*.level_number' => ['required', 'integer', 'min:1', 'max:5'],
            'levels.*.level_name' => ['required', 'string', 'max:100'],
            'levels.*.role_name' => ['required', 'string', 'in:admin,editor'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'is_multi_level.required' => 'Multi-level flag is required.',
            'levels.required_if' => 'Levels are required when multi-level workflow is enabled.',
            'levels.min' => 'At least one approval level is required for multi-level workflow.',
            'levels.max' => 'Maximum of 5 approval levels allowed.',
            'levels.*.level_number.required' => 'Level number is required for each level.',
            'levels.*.level_name.required' => 'Level name is required for each level.',
            'levels.*.role_name.required' => 'Role name is required for each level.',
            'levels.*.role_name.in' => 'Role must be either admin or editor.',
        ];
    }
}
