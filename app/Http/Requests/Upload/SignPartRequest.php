<?php

namespace App\Http\Requests\Upload;

use Illuminate\Foundation\Http\FormRequest;

class SignPartRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'key' => 'required|string',
      'uploadId' => 'required|string',
      'partNumber' => 'required|integer',
    ];
  }
}
