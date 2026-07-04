<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class SimulateAddonWebhookRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'session_id' => 'required|string',
            'force' => 'nullable|boolean', // Para testing
        ];
    }
}
