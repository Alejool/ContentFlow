<?php

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExternalCalendarRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'sync_enabled' => 'boolean',
            'sync_campaigns' => 'array',
            'sync_campaigns.*' => 'integer|exists:campaigns,id',
            'sync_platforms' => 'array',
            'sync_platforms.*' => 'string',
        ];
    }
}
