<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'locale' => ['nullable', 'string', 'in:en,es'],
            'phone' => [
                'nullable',
                'string',
                'regex:/^\+[1-9]\d{1,14}$/',
                function ($attribute, $value, $fail) {
                    if (!$value) return;

                    $supportedPrefixes = [
                        '+54',
                        '+591',
                        '+55',
                        '+56',
                        '+57',
                        '+506',
                        '+53',
                        '+1',
                        '+593',
                        '+503',
                        '+502',
                        '+509',
                        '+504',
                        '+52',
                        '+505',
                        '+507',
                        '+595',
                        '+51',
                        '+598',
                        '+58'
                    ];

                    $valid = false;
                    foreach ($supportedPrefixes as $prefix) {
                        if (str_starts_with($value, $prefix)) {
                            $valid = true;
                            break;
                        }
                    }

                    if (!$valid) {
                        $fail(__('The phone number must belong to a supported country (LatAm or USA).'));
                    }
                },
            ],
            'country_code' => ['nullable', 'string', 'max:10'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'global_platform_settings' => ['nullable', 'array'],
            'ai_settings' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => __('The name field is required.'),
            'name.max' => __('The name may not be greater than 255 characters.'),
            'email.required' => __('The email field is required.'),
            'email.email' => __('The email must be a valid email address.'),
            'email.unique' => __('The email has already been taken.'),
            'phone.regex' => __('The phone number format is invalid.'),
            'bio.max' => __('The bio may not be greater than 1000 characters.'),
        ];
    }
}
