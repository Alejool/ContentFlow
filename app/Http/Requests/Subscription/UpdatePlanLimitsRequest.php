<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePlanLimitsRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'plan' => 'required|string|in:free,starter,growth,professional,enterprise',
        ];
    }
}
