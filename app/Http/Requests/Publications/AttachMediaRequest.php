<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;

class AttachMediaRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'key' => 'required|string',
      'filename' => 'required|string',
      'mime_type' => 'required|string',
      'size' => 'required|integer',
      'duration' => 'nullable|numeric|min:0',
      'width' => 'nullable|integer|min:1',
      'height' => 'nullable|integer|min:1',
      'aspect_ratio' => 'nullable|numeric|min:0',
    ];
  }
}
