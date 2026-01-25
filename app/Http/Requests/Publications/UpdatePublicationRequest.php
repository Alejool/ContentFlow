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
    $publication = $this->route('publication');
    if (!$publication instanceof Publication) {
      $publication = Publication::find($publication);
    }
    return [
      'title' => 'required|string|max:255',
      'description' => 'required|string',
      'hashtags' => 'nullable|string',
      'goal' => 'nullable|string',
      'start_date' => 'nullable|date',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'status' => [
        'nullable',
        'string',
        function ($attribute, $value, $fail) use ($publication) {
          if (!$publication || !$value) return;

          if ($publication->status === 'scheduled' || $publication->status === 'approved') {
            return;
          }
          if ($publication->status === 'published') {
            $hasPublishedPosts = $publication->socialPostLogs()
              ->where('status', 'published')
              ->exists();

            if ($hasPublishedPosts && $value !== 'published') {
              $fail('Cannot change status from published when posts are already published on social media. Unpublish first.');
            }
          }
        }
      ],
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
      'social_account_schedules' => 'nullable|array',
      'platform_settings' => 'nullable',
      'campaign_id' => 'nullable|exists:campaigns,id',
      'media' => 'nullable|array',
      'media' => 'nullable|array',
      // Allow media items to be either files OR arrays (metadata for direct uploads)
      'media.*' => [
        function ($attribute, $value, $fail) {
          if ($value instanceof \Illuminate\Http\UploadedFile) {
            return;
          }
          if (is_array($value) && isset($value['key'])) {
            // It's metadata
            return;
          }
          $fail('The ' . $attribute . ' must be a file or valid upload metadata.');
        }
      ],
      'media_keep_ids' => 'nullable|array',
      'removed_media_ids' => 'nullable|array',
      'thumbnails' => 'nullable|array',
      'thumbnails.*' => 'file|mimes:jpeg,png,jpg|max:5120',
      'removed_thumbnail_ids' => 'nullable|array',
      'youtube_thumbnail' => 'nullable|file|mimes:jpeg,png,jpg|max:5120',
      'youtube_thumbnail_video_id' => 'nullable|exists:media_files,id',
    ];
  }
}
