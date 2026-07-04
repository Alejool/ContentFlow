<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class CreateSubscriptionCheckoutRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'plan' => 'required|in:starter,growth,professional,enterprise',
            'gateway' => 'nullable|string|in:stripe,mercadopago,epayco,payu,wompi',
        ];
    }
}
