<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Publications\Publication;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;
use Carbon\Carbon;

class StorePublicationRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    // Debug: Log incoming data before validation
    Log::info('StorePublicationRequest - Incoming data:', [
      'all_data' => $this->all(),
      'status' => $this->input('status'),
      'method' => $this->method(),
      'url' => $this->fullUrl()
    ]);

    return [
      'title' => [
        'required',
        'string',
        'max:255',
        function ($attribute, $value, $fail) {
          if (Publication::where('title', $value)->exists()) {
            $fail('Publication already exists');
          }
        },
      ],
      'description' => 'required|string',
      'hashtags' => 'nullable|string',
      'goal' => 'nullable|string',
      'start_date' => 'nullable|date',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'status' => 'nullable|in:draft,published,publishing,failed,pending_review,approved,scheduled,rejected',
      'scheduled_at' => [
        'nullable',
        'date',
        function ($attribute, $value, $fail) {
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
      'social_accounts.*' => 'exists:social_accounts,id',
      'social_account_schedules' => 'nullable|array',
      'social_account_schedules.*' => [
        'nullable',
        'date',
        function ($attribute, $value, $fail) {
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
      'platform_settings' => 'nullable|string',
      'campaign_id' => 'nullable|exists:campaigns,id',
      'media' => 'nullable|array',
      // Allow media items to be either files OR arrays (metadata for direct uploads)
      // 'media.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,avi|max:51200',
      // We can't strictly validate mixed types easily with just 'media.*'.
      // More complex custom validation might be needed if we want strictness,
      // but for now let's relax it to allow the controller/service to handle valid data.
      'media.*' => [
        function ($attribute, $value, $fail) {
          if ($value instanceof UploadedFile) {
            // Standard file validation logic could go here if needed,
            // or we rely on the fact it IS a file.
            // We can check extension/mime if we want.
            return;
          }
          if (is_array($value) && isset($value['key'])) {
            // It's metadata
            return;
          }
          $fail('The ' . $attribute . ' must be a file or valid upload metadata.');
        }
      ],
      'youtube_types' => 'nullable|array',
      'durations' => 'nullable|array',
      'thumbnails' => 'nullable|array',
    ];
  }
}
