<?php

namespace App\Http\Requests\Upload;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUploadProgressRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'upload_id' => 'required|string',
      'progress' => 'required|integer|min:0|max:100',
      'bytes_uploaded' => 'required|integer|min:0',
      'total_bytes' => 'required|integer|min:1',
      'speed' => 'nullable|numeric|min:0',
      'eta' => 'nullable|integer|min:0',
    ];
  }
}
