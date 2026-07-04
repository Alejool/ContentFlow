<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class UpdateScheduledReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'string|max:255',
            'type' => 'in:publications,analytics,campaigns',
            'frequency' => 'in:daily,weekly,monthly',
            'recipients' => 'array',
            'recipients.*' => 'email',
            'filters' => 'nullable|array',
            'is_active' => 'boolean',
        ];
    }
}
