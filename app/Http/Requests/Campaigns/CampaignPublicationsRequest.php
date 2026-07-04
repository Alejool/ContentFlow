<?php

namespace App\Http\Requests\Campaigns;

use Illuminate\Foundation\Http\FormRequest;

class CampaignPublicationsRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'publication_ids' => 'required|array',
      'publication_ids.*' => 'exists:publications,id',
    ];
  }
}
