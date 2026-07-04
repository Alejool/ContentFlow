<?php

namespace App\Http\Requests\Translation;

use Illuminate\Foundation\Http\FormRequest;

class TranslateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => 'required|string|max:5000',
            'target_language' => 'required|string|in:en,es',
            'source_language' => 'nullable|string|in:en,es',
            'context' => 'nullable|string|max:500',
        ];
    }
}
