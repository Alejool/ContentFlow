<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UploadAvatarRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'avatar' => 'required|image|mimes:jpeg,jpg,png,gif,webp,svg|max:2048', // 2MB max
      'name' => 'required|string',
    ];
  }
}
