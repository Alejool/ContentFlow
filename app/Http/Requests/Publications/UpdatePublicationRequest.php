<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Publications\Publication;

class UpdatePublicationRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    $publication = Publication::find($this->route('id'));

    return [
      'title' => 'required|string|max:255',
      'description' => 'required|string',
      'hashtags' => 'nullable|string',
      'goal' => 'nullable|string',
      'start_date' => 'nullable|date',
      'end_date' => 'nullable|date|after_or_equal:start_date',

      'scheduled_at' => [
        'nullable',
        'date',
        function ($attribute, $value, $fail) use ($publication) {
          if (!$publication) return;
          $existing = $publication->scheduled_at;
          if ($value && strtotime($value) < time()) {
            if (!$existing || abs(strtotime($value) - strtotime($existing)) > 60) {
              $fail('The scheduled date must be in the future.');
            }
          }
        }
      ],
      'social_accounts' => 'nullable|array',
      'social_accounts.*' => 'exists:social_accounts,id',
      'platform_settings' => 'nullable',
      'campaign_id' => 'nullable|exists:campaigns,id',
      'media' => 'nullable|array',
      'media.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,avi|max:51200',
      'media_keep_ids' => 'nullable|array',
      'thumbnails' => 'nullable|array',
      'thumbnails.*' => 'file|mimes:jpeg,png,jpg|max:5120',
      'removed_thumbnail_ids' => 'nullable|array',
      'youtube_thumbnail' => 'nullable|file|mimes:jpeg,png,jpg|max:5120',
      'youtube_thumbnail_video_id' => 'nullable|exists:media_files,id',
    ];
  }
}
