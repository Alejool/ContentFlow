<?php

namespace App\Http\Requests\Social;

use Illuminate\Foundation\Http\FormRequest;

class AccountCapabilitiesRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'account_ids' => 'required|array',
            'account_ids.*' => 'exists:social_accounts,id',
            'video_duration' => 'required|integer|min:1',
            'file_size_mb' => 'required|numeric|min:0',
        ];
    }
}
