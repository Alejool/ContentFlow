<?php

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;

class BulkRescheduleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'event_ids' => 'required|array',
            'event_ids.*' => 'required|string',
            'scheduled_at' => 'required|date',
        ];
    }
}
