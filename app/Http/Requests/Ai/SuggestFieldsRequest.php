<?php

namespace App\Http\Requests\Ai;

use Illuminate\Foundation\Http\FormRequest;

class SuggestFieldsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fields' => 'required|array',
            'type' => 'required|string|in:publication,campaign',
            'language' => 'nullable|string',
            'field_limits' => 'nullable|array',
        ];
    }
}
