<?php

namespace App\Http\Requests\Workspace;

use App\Constants\ApiScopes;
use Illuminate\Foundation\Http\FormRequest;

class StoreApiTokenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'      => 'required|string|max:255',
            'abilities' => 'nullable|array',
            'abilities.*' => [
                'string',
                function ($attribute, $value, $fail) {
                    if (!ApiScopes::isValid($value)) {
                        $fail("Invalid scope: {$value}. See /api/v1/auth/scopes for valid values.");
                    }
                },
            ],
        ];
    }
}
