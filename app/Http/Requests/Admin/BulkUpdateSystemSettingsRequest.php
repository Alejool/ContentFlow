<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateSystemSettingsRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'settings' => 'required|array',
            'settings.*.id' => 'required|exists:system_settings,id',
            'settings.*.value' => 'required',
        ];
    }
}
