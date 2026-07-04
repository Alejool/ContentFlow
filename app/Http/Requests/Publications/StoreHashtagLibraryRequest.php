<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;

class StoreHashtagLibraryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'hashtags' => 'required|array',
            'hashtags.*' => 'string',
            'category' => 'nullable|string|max:100',
            'is_favorite' => 'boolean',
        ];
    }
}
