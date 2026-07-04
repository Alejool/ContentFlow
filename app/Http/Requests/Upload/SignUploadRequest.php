<?php

namespace App\Http\Requests\Upload;

use Illuminate\Foundation\Http\FormRequest;

class SignUploadRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'filename'     => 'required|string',
      'content_type' => 'required|string',
      'file_size'    => 'nullable|integer|min:1', // bytes — sent by frontend
      'pending_bytes' => 'nullable|integer|min:0', // bytes of files already queued for upload
      'context'      => 'nullable|string|in:publication,profile,workspace', // upload context
    ];
  }
}
