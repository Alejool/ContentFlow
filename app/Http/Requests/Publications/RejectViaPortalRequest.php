<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;

class RejectViaPortalRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'reason' => 'nullable|string|max:1000',
        ];
    }
}
