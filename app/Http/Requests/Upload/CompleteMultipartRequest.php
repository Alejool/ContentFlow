<?php

namespace App\Http\Requests\Upload;

use Illuminate\Foundation\Http\FormRequest;

class CompleteMultipartRequest extends FormRequest
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
      'parts' => 'required|array',
      'parts.*.ETag' => 'required|string',
      'parts.*.PartNumber' => 'required|integer',
    ];
  }
}
