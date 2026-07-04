<?php

namespace App\Http\Requests\Locale;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLocaleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'locale' => ['required', 'string', 'in:en,es'],
        ];
    }
}
