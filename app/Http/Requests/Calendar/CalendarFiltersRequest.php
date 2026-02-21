<?php

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;

class CalendarFiltersRequest extends FormRequest
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
            'start' => [
                'required',
                'date',
            ],
            'end' => [
                'required',
                'date',
                'after:start',
            ],
            'platforms' => [
                'nullable',
                'string',
            ],
            'campaigns' => [
                'nullable',
                'string',
            ],
            'statuses' => [
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
            'start.required' => 'Start date is required.',
            'start.date' => 'Start date must be a valid date.',
            'end.required' => 'End date is required.',
            'end.date' => 'End date must be a valid date.',
            'end.after' => 'End date must be after start date.',
        ];
    }

    /**
     * Get validated filters as arrays
     *
     * @return array
     */
    public function getFilters(): array
    {
        return [
            'platforms' => $this->platforms ? explode(',', $this->platforms) : [],
            'campaigns' => $this->campaigns ? explode(',', $this->campaigns) : [],
            'statuses' => $this->statuses ? explode(',', $this->statuses) : [],
        ];
    }
}
