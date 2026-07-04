<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseAddonRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'sku' => 'required|string',
            'quantity' => 'nullable|integer|min:1|max:100',
            'gateway' => 'nullable|string|in:stripe,mercadopago,epayco,payu,wompi',
        ];
    }
}
