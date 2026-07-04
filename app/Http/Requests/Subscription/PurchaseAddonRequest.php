<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseAddonRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'sku' => 'required|string',
            'quantity' => 'required|integer|min:1',
        ];
    }
}
