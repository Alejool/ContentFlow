<?php

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;

class SyncSettingsRequest extends FormRequest
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
            'syncEnabled' => [
                'required',
                'boolean',
            ],
            'syncCampaigns' => [
                'nullable',
                'array',
            ],
            'syncCampaigns.*' => [
                'integer',
                'exists:campaigns,id',
            ],
            'syncPlatforms' => [
                'nullable',
                'array',
            ],
            'syncPlatforms.*' => [
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
            'syncEnabled.required' => 'Sync enabled status is required.',
            'syncEnabled.boolean' => 'Sync enabled must be true or false.',
            'syncCampaigns.array' => 'Sync campaigns must be an array.',
            'syncCampaigns.*.integer' => 'Each campaign ID must be an integer.',
            'syncCampaigns.*.exists' => 'One or more selected campaigns do not exist.',
            'syncPlatforms.array' => 'Sync platforms must be an array.',
            'syncPlatforms.*.string' => 'Each platform must be a string.',
        ];
    }
}
