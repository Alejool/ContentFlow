<?php

namespace App\Http\Requests\Upload;

use Illuminate\Foundation\Http\FormRequest;

class PauseUploadRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      's3_key' => 'required|string',
      'multipart_upload_id' => 'required|string',
      'uploaded_parts' => 'required|array',
      'uploaded_parts.*.PartNumber' => 'required|integer',
      'uploaded_parts.*.ETag' => 'required|string',
      'bytes_uploaded' => 'nullable|integer|min:0',
      'total_bytes' => 'nullable|integer|min:1',
    ];
  }
}
