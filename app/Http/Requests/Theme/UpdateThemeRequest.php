<?php

namespace App\Http\Requests\Theme;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateThemeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'theme' => ['nullable', Rule::in(['light', 'dark', 'system'])],
            'theme_color' => ['nullable', 'string', 'regex:/^(orange|blue|purple|green|yellow|pink|red|indigo|teal|sky|#[a-fA-F0-9]{6})$/'],
        ];
    }
}
