<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;

class SuggestContentTypeRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'media' => 'nullable|array',
      'current_type' => 'nullable|string|in:post,reel,story,carousel,poll',
    ];
  }
}
