<?php

namespace App\Http\Requests\Ai;

use Illuminate\Foundation\Http\FormRequest;

class ComposerAssistantRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'platforms' => 'nullable|array',
      'platforms.*' => 'string|max:30',
      'draft' => 'nullable|string|max:2000',
      'timezone' => 'nullable|timezone',
      'locale' => 'nullable|in:es,en',
    ];
  }
}
