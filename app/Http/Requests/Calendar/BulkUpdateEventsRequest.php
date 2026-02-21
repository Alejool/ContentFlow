<?php

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkUpdateEventsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
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
            'event_ids' => [
                'required',
                'array',
                'min:1',
                'max:100', // Limit bulk operations to 100 events
            ],
            'event_ids.*' => [
                'required',
                'string',
            ],
            'new_date' => [
                'required',
                'date',
                'after_or_equal:' . now()->subDay()->toDateString(),
            ],
            'operation' => [
                'required',
                'string',
                Rule::in(['move', 'delete']),
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
            'event_ids.required' => 'At least one event must be selected.',
            'event_ids.array' => 'Event IDs must be provided as an array.',
            'event_ids.min' => 'At least one event must be selected.',
            'event_ids.max' => 'Cannot perform bulk operations on more than 100 events at once.',
            'new_date.required' => 'A new date is required for the move operation.',
            'new_date.date' => 'The new date must be a valid date.',
            'new_date.after_or_equal' => 'The new date cannot be more than one day in the past.',
            'operation.required' => 'Operation type is required.',
            'operation.in' => 'Invalid operation. Must be move or delete.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Ensure event_ids is always an array
        if ($this->has('event_ids') && !is_array($this->event_ids)) {
            $this->merge([
                'event_ids' => [$this->event_ids],
            ]);
        }
    }
}
