<?php

namespace App\Http\Requests\PlatformConfiguration;

use Illuminate\Foundation\Http\FormRequest;

class AvailablePlatformsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content_type' => 'required|string',
            'user_plan' => 'sometimes|string',
        ];
    }
}
