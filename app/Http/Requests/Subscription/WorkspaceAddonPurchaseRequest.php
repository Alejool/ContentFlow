<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class WorkspaceAddonPurchaseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'sku' => 'required|string',
            'quantity' => 'integer|min:1|max:100',
        ];
    }
}
