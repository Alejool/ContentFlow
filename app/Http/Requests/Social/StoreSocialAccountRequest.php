<?php

namespace App\Http\Requests\Social;

use Illuminate\Foundation\Http\FormRequest;

class StoreSocialAccountRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'platform' => 'required|string|in:facebook,instagram,threads,twitter,youtube,tiktok',
            'account_id' => 'required|string',
            'access_token' => 'required|string',
            'refresh_token' => 'nullable|string',
            'token_expires_at' => 'nullable|date',
            'account_name' => 'nullable|string',
            'account_metadata' => 'nullable|array',
        ];
    }
}
