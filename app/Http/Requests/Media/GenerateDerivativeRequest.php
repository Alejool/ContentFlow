<?php

namespace App\Http\Requests\Media;

use Illuminate\Foundation\Http\FormRequest;

class GenerateDerivativeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'width' => 'required|integer|min:1|max:4000',
            'format' => 'nullable|in:webp,avif,jpeg',
        ];
    }
}
