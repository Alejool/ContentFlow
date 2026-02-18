<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Publications\Publication;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;

class UpdatePublicationRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  /**
   * Prepare the data for validation.
   */
  protected function prepareForValidation(): void
  {
    // Handle social_accounts if it comes as JSON string
    if ($this->has('social_accounts')) {
      $socialAccounts = $this->input('social_accounts');
      
      // If it's a string, try to decode it
      if (is_string($socialAccounts)) {
        // Handle empty string
        if ($socialAccounts === '' || $socialAccounts === null) {
          $this->merge(['social_accounts' => []]);
        } else {
          // Try to decode JSON
          $decoded = json_decode($socialAccounts, true);
          if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $this->merge(['social_accounts' => $decoded]);
          }
        }
      }
    } 
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
          if ($value) {
            $scheduledDate = Carbon::parse($value);
            $now = Carbon::now();
            
            // Check if scheduled date is more than 1 minute in the future
            if ($scheduledDate->diffInSeconds($now, false) >= -60) {
              $fail(__('publications.validation.scheduledMinDifference'));
            }
          }
        }
      ],
      'social_accounts' => 'nullable|array',
      'social_accounts.*' => 'integer|exists:social_accounts,id',
      'clear_social_accounts' => 'nullable',
      'social_account_schedules' => 'nullable|array',
      'social_account_schedules.*' => [
        'nullable',
        'date',
        function ($attribute, $value, $fail) use ($publication) {
          if (!$publication || !$value) return;

          // Extract account ID from attribute name
          preg_match('/(?:social_account_schedules|account_schedules)\.(\d+)/', $attribute, $matches);
          $accountId = $matches[1] ?? null;

          if ($accountId) {
            $existingPost = $publication->scheduled_posts()
              ->where('social_account_id', $accountId)
              ->first();
            $existing = $existingPost?->scheduled_at;

            $scheduledDate = Carbon::parse($value);
            $now = Carbon::now();
            
            // Check if scheduled date is more than 1 minute in the future
            if ($scheduledDate->diffInSeconds($now, false) >= -60) {
              $fail(__('publications.validation.scheduledMinDifference'));
            }
          }
        }
      ],
      'social_accounts.*' => [
        function ($attribute, $value, $fail) use ($publication) {
          if (!$publication) return;

          $accountId = $value;
          // Check if this account has an individual schedule in the request
          $individualSchedule = $this->input("social_account_schedules.{$accountId}");

          // If no individual schedule, it inherits the global scheduled_at
          if (!$individualSchedule) {
            $globalSchedule = $this->input('scheduled_at') ?? $publication->scheduled_at;

            if ($globalSchedule) {
              $scheduledDate = Carbon::parse($globalSchedule);
              $now = Carbon::now();
              
              // Check if scheduled date is more than 1 minute in the future
              if ($scheduledDate->diffInSeconds($now, false) >= -60) {
                $fail(__('publications.validation.scheduledMinDifference'));
              }
            }
          }
        }
      ],
      'platform_settings' => 'nullable',
      'campaign_id' => 'nullable|exists:campaigns,id',
      'media' => 'nullable|array',
      'media' => 'nullable|array',
      // Allow media items to be either files OR arrays (metadata for direct uploads)
      'media.*' => [
        function ($attribute, $value, $fail) {
          if ($value instanceof UploadedFile) {
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
