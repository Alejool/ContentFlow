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
      'current_password' => ['required'],
      'password' => ['required', 'string'],
      'password_confirmation' => ['required', 'string'],
      ];
  
  }
}
