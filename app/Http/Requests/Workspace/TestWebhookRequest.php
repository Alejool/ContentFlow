<?php

namespace App\Http\Requests\Workspace;

use Illuminate\Foundation\Http\FormRequest;

class TestWebhookRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'type' => 'required|in:slack,discord',
      'url' => 'required|url',
    ];
  }
}
