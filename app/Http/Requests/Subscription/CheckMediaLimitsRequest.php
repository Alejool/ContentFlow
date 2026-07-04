<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class CheckMediaLimitsRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'file_size' => 'required|integer|min:1',
            'duration_minutes' => 'nullable|integer|min:0',
        ];
    }
}
