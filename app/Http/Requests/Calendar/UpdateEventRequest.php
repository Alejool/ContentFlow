<?php

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Check if user has permission to update calendar events
        // This will be checked in the controller for specific event ownership
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'scheduled_at' => [
                'required',
                'date',
                'after_or_equal:' . now()->subDay()->toDateString(), // Allow dates from yesterday onwards
            ],
            'type' => [
                'required',
                'string',
                Rule::in(['publication', 'post', 'user_event']),
            ],
            'current_version' => [
                'nullable',
                'string',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'scheduled_at.required' => 'A scheduled date is required.',
            'scheduled_at.date' => 'The scheduled date must be a valid date.',
            'scheduled_at.after_or_equal' => 'The scheduled date cannot be more than one day in the past.',
            'type.required' => 'Event type is required.',
            'type.in' => 'Invalid event type. Must be publication, post, or user_event.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'scheduled_at' => 'scheduled date',
        ];
    }
}
