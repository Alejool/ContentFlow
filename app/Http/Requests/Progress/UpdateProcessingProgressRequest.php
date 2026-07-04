<?php

namespace App\Http\Requests\Progress;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProcessingProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'job_id' => 'required|string',
            'progress' => 'required|integer|min:0|max:100',
            'current_step' => 'nullable|string',
            'total_steps' => 'nullable|integer|min:0',
            'completed_steps' => 'nullable|integer|min:0',
            'eta' => 'nullable|integer|min:0',
        ];
    }
}
