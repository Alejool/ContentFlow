<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSystemNotificationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'description' => 'nullable|string',
            'type' => 'required|string|in:info,success,warning,error',
            'icon' => 'nullable|string',
        ];
    }
}
