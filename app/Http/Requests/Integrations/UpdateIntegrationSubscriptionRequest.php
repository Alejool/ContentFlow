<?php

namespace App\Http\Requests\Integrations;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIntegrationSubscriptionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'channel_name' => 'nullable|string|max:128',
            'config'       => 'sometimes|array',
            'is_active'    => 'sometimes|boolean',
        ];
    }
}
