<?php

namespace App\Http\Requests\Social;

use Illuminate\Foundation\Http\FormRequest;

class SchedulePostRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'content' => 'required',
            'platforms' => 'required|array',
            'scheduled_at' => 'nullable|date',
        ];
    }
}
