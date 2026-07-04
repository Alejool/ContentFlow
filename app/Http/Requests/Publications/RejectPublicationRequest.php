<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;

class RejectPublicationRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'rejection_reason' => 'required|string|min:10|max:500',
    ];
  }

  public function messages(): array
  {
    return [
      'rejection_reason.required' => __('validation.rejection_reason_required'),
      'rejection_reason.min' => __('validation.rejection_reason_min'),
      'rejection_reason.max' => __('validation.rejection_reason_max'),
    ];
  }
}
