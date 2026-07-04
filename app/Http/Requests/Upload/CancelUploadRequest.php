<?php

namespace App\Http\Requests\Upload;

use Illuminate\Foundation\Http\FormRequest;

class CancelUploadRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      's3_key' => 'required|string',
      'multipart_upload_id' => 'nullable|string',
    ];
  }
}
