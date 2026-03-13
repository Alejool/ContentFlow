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
            'levels.*.level_number' => ['required_with:levels', 'integer', 'min:1', 'max:5'],
            'levels.*.level_name' => ['required_with:levels', 'string', 'max:100'],
            'levels.*.role_name' => [
                'required_with:levels', 
                'string', 
                'exists:roles,name',
                function ($attribute, $value, $fail) {
                    // Check if role can participate in approvals
                    $role = \App\Models\Role\Role::where('name', $value)->first();
                    if ($role && !$role->approval_participant) {
                        $fail("The role '{$value}' cannot participate in approval workflows.");
                    }
                }
            ],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Check for duplicate roles in multi-level workflow
            if ($this->is_multi_level && is_array($this->levels)) {
                $roleNames = array_column($this->levels, 'role_name');
                if (count($roleNames) !== count(array_unique($roleNames))) {
                    $validator->errors()->add('levels', 'Each role can only be assigned to one approval level.');
                }

                // Check for sequential level numbers
                $levelNumbers = array_column($this->levels, 'level_number');
                sort($levelNumbers);
                $expectedNumbers = range(1, count($this->levels));
                
                if ($levelNumbers !== $expectedNumbers) {
                    $validator->errors()->add('levels', 'Approval levels must be numbered sequentially starting from 1.');
                }
            }
        });
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
            'levels.*.level_number.required_with' => 'Level number is required for each level.',
            'levels.*.level_name.required_with' => 'Level name is required for each level.',
            'levels.*.role_name.required_with' => 'Role name is required for each level.',
            'levels.*.role_name.exists' => 'The selected role does not exist.',
        ];
    }
}
