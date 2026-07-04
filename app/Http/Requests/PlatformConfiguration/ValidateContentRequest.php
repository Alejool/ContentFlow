<?php

namespace App\Http\Requests\PlatformConfiguration;

use Illuminate\Foundation\Http\FormRequest;

class ValidateContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'publication_id' => 'required|integer|exists:publications,id',
            'platforms' => 'required|array|min:1',
            'platforms.*' => 'string',
            'user_plan' => 'sometimes|string',
        ];
    }
}
