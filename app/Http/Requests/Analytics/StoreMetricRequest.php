<?php

namespace App\Http\Requests\Analytics;

use Illuminate\Foundation\Http\FormRequest;

class StoreMetricRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'metric_type' => 'required|string',
            'metric_name' => 'required|string',
            'metric_value' => 'required|numeric',
            'metric_date' => 'required|date',
            'platform' => 'nullable|string',
            'reference_id' => 'nullable|integer',
        ];
    }
}
