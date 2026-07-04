<?php

namespace App\Http\Requests\Approval;

use Illuminate\Foundation\Http\FormRequest;

class ProcessApprovalRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'action' => 'required|in:approve,reject,advance',
            'reason' => 'required|string|max:500',
            'target_level' => 'nullable|integer|min:0',
        ];
    }
}
