<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;

class SuggestContentTypeByMediaRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'duration' => 'nullable|numeric|min:0',
            'mime_type' => 'required|string',
            'current_type' => 'required|string|in:post,reel,story,carousel,poll',
        ];
    }
}
