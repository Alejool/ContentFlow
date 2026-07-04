<?php

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;

class ExportCalendarRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'events' => 'required|array',
            'events.*.title' => 'required|string',
            'events.*.start' => 'required|date',
            'events.*.end' => 'nullable|date',
            'events.*.description' => 'nullable|string',
        ];
    }
}
