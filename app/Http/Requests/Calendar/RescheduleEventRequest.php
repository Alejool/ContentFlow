<?php

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;

class RescheduleEventRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'scheduled_at' => 'required|date|after:now',
            'type' => 'nullable|in:post,user_event',
        ];
    }
}
