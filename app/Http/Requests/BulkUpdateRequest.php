<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled in the controller
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
            'event_ids' => 'required|array|min:1',
            'event_ids.*' => 'required|string',
            'new_date' => 'required|date|after:now',
            'operation' => 'required|in:move,delete',
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
            'event_ids.required' => 'At least one event must be selected.',
            'event_ids.array' => 'Event IDs must be provided as an array.',
            'event_ids.min' => 'At least one event must be selected.',
            'event_ids.*.required' => 'Each event ID is required.',
            'event_ids.*.string' => 'Each event ID must be a string.',
            'new_date.required' => 'A new date is required for the operation.',
            'new_date.date' => 'The new date must be a valid date.',
            'new_date.after' => 'Cannot schedule for a past date. Please select a future date.',
            'operation.required' => 'An operation type is required.',
            'operation.in' => 'The operation must be either "move" or "delete".',
        ];
    }
}
