<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;


class PasswordUpdateRequest extends FormRequest
{
  /**
   * Get the validation rules that apply to the request.
   *
   * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
   */
  public function rules(): array
  {
    return [
      'current_password' => ['required', 'string'],
      'password' => ['required', 'string', 'min:8', 'confirmed'],
      'password_confirmation' => ['required', 'string', 'min:8'],
    ];
  }

  public function messages(): array
  {
    return [
      'current_password.required' => __('validation.required', ['attribute' => 'contraseña actual']),
      'password.required' => __('validation.required', ['attribute' => 'contraseña']),
      'password.min' => __('validation.min.string', ['attribute' => 'contraseña', 'min' => 8]),
      'password.confirmed' => __('validation.confirmed', ['attribute' => 'contraseña']),
      'password_confirmation.required' => __('validation.required', ['attribute' => 'confirmación de contraseña']),
    ];
  }
}
