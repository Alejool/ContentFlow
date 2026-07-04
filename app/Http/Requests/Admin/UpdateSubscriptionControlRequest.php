<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSubscriptionControlRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'demo_mode' => 'sometimes|boolean',
            'purchases_enabled' => 'sometimes|boolean',
            'grace_period_days' => 'sometimes|integer|min:1|max:365',
            'max_retry_attempts' => 'sometimes|integer|min:1|max:10',
            'retry_interval_hours' => 'sometimes|integer|min:1|max:168',
        ];
    }
}
