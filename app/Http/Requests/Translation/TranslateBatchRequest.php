<?php

namespace App\Http\Requests\Translation;

use Illuminate\Foundation\Http\FormRequest;

class TranslateBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'texts' => 'required|array|max:50',
            'texts.*' => 'required|string|max:5000',
            'target_language' => 'required|string|in:en,es',
            'source_language' => 'nullable|string|in:en,es',
        ];
    }
}
