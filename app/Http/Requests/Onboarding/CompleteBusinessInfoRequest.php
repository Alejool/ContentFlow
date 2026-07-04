<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;

class CompleteBusinessInfoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'businessName' => 'nullable|string|max:255',
            'businessIndustry' => 'nullable|string|max:255',
            'businessGoals' => 'nullable|string|max:1000',
            'businessSize' => 'nullable|string|max:255',
        ];
    }
}
