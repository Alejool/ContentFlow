<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Publications\Publication;
use Illuminate\Support\Facades\Log;

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

    // Debug: Log incoming data before validation for traceability
    Log::info('UpdatePublicationRequest - Validation Data:', [
      'id_from_route' => $publication?->id,
      'current_status' => $publication?->status,
      'all_input' => $this->all(),
    ]);

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
        // 'in:draft,published,publishing,failed,pending_review,approved,scheduled,rejected', // Relaxed for debugging
        function ($attribute, $value, $fail) use ($publication) {
          if (!$publication || !$value) return;

          // Allow changes from scheduled or approved state
          if ($publication->status === 'scheduled' || $publication->status === 'approved') {
            return;
          }

          // If publication is published, check if it has published posts
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
