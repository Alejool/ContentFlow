<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHashtagLibraryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'string|max:255',
            'hashtags' => 'array',
            'hashtags.*' => 'string',
            'category' => 'nullable|string|max:100',
            'is_favorite' => 'boolean',
        ];
    }
}
