<?php

namespace App\Http\Requests\Campaigns;

use Illuminate\Foundation\Http\FormRequest;

class StoreCampaignRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => 'required|string|max:255',
      'description' => 'nullable|string',
      'status' => 'nullable|in:draft,active,paused,completed',
      'start_date' => 'nullable|date',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'goal' => 'nullable|string',
      'budget' => 'nullable|numeric|min:0',
      'publication_ids' => 'nullable|array',
      'publication_ids.*' => 'exists:publications,id',
    ];
  }
}
