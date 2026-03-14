<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Publications\Publication;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;
use Carbon\Carbon;
use App\Services\Publications\ContentTypeValidationService;
use Illuminate\Contracts\Validation\Validator;

class StorePublicationRequest extends FormRequest
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
    // Default content_type to 'post' if not provided
    if (!$this->has('content_type') || empty($this->input('content_type'))) {
      $this->merge([
        'content_type' => 'post'
      ]);
    }

    if ($this->has('is_recurring')) {
      $this->merge([
        'is_recurring' => filter_var($this->is_recurring, FILTER_VALIDATE_BOOLEAN)
      ]);
    }

    if ($this->has('recurrence_days') && is_string($this->recurrence_days)) {
      $days = array_filter(explode(',', $this->recurrence_days), 'strlen');
      $this->merge([
        'recurrence_days' => array_map('intval', $days)
      ]);
    }

    if ($this->has('recurrence_accounts') && is_string($this->recurrence_accounts)) {
      $accounts = array_filter(explode(',', $this->recurrence_accounts), 'strlen');
      $this->merge([
        'recurrence_accounts' => array_map('intval', $accounts)
      ]);
    }
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
      'description' => [
        'string',
        function ($attribute, $value, $fail) {
          $contentType = $this->input('content_type', 'post');
          
          // For stories, description is optional
          if ($contentType === 'story') {
            return;
          }
          
          // For other content types, description is required
          if (empty($value) || trim($value) === '') {
            $fail('Description is required for this content type.');
            return;
          }
        }
      ],
      'hashtags' => [
        'nullable',
        'string',
        function ($attribute, $value, $fail) {
          $contentType = $this->input('content_type', 'post');
          
          // For polls and stories, hashtags are optional
          if ($contentType === 'poll' || $contentType === 'story') {
            return;
          }
          
          // For other content types, hashtags are required
          if (empty($value) || trim($value) === '') {
            $fail('Hashtags are required for this content type.');
            return;
          }
          
          // Simple validation: just check if there's at least one # character
          if (!str_contains($value, '#')) {
            $fail('At least one hashtag is required (must start with #).');
            return;
          }
          
          // Count hashtags (better separation logic)
          $hashtags = array_filter(
            preg_split('/[\s,]+/', $value), 
            function($tag) {
              $tag = trim($tag);
              return !empty($tag) && str_starts_with($tag, '#') && strlen($tag) > 1;
            }
          );
          
          if (count($hashtags) > 10) {
            $fail('Maximum 10 hashtags allowed.');
          }
        }
      ],
      'goal' => 'nullable|string',
      'start_date' => 'nullable|date',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'status' => 'nullable|in:draft,published,publishing,failed,pending_review,approved,scheduled,rejected',
      'scheduled_at' => [
        'nullable',
        'date',
        function ($attribute, $value, $fail) {
          if (!$value) return;
          
          $contentType = $this->input('content_type', 'post');
          
          $scheduledDate = Carbon::parse($value);
          $now = Carbon::now();

          // For polls, be more lenient - just needs to be in the future
          if ($contentType === 'poll') {
            if ($scheduledDate->isPast()) {
              $fail(__('publications.validation.scheduledInPast', ['type' => 'poll']));
            }
            return;
          }

          // For other content types, check if scheduled date is at least 1 minute in the future
          if ($scheduledDate->diffInSeconds($now, false) > -60) {
            $fail(__('publications.validation.scheduledMinDifference'));
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
          if (!$value) return;
          
          $contentType = $this->input('content_type', 'post');
          
          $scheduledDate = Carbon::parse($value);
          $now = Carbon::now();

          // For polls, be more lenient - just needs to be in the future
          if ($contentType === 'poll') {
            if ($scheduledDate->isPast()) {
              $fail(__('publications.validation.scheduledInPast', ['type' => 'poll']));
            }
            return;
          }

          // For other content types, check if scheduled date is at least 1 minute in the future
          if ($scheduledDate->diffInSeconds($now, false) > -60) {
            $fail(__('publications.validation.scheduledMinDifference'));
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
      // Recurrence
      'is_recurring' => 'nullable|boolean',
      'recurrence_type' => 'nullable|required_if:is_recurring,true|in:daily,weekly,monthly,yearly',
      'recurrence_interval' => 'nullable|integer|min:1',
      'recurrence_days' => 'nullable|array',
      'recurrence_days.*' => 'integer|min:0|max:6',
      'recurrence_end_date' => [
        'nullable',
        'date',
        'after_or_equal:now',
        function ($attribute, $value, $fail) {
          // If is_recurring is true, end date is REQUIRED
          if ($this->boolean('is_recurring') && !$value) {
            $fail(__('publications.modal.validation.recurrenceEndDateRequired') ?? 'End date is required for recurring publications');
          }
        }
      ],
      'recurrence_accounts' => 'nullable|array',
      'recurrence_accounts.*' => 'integer|exists:social_accounts,id',
      // Content type
      'content_type' => 'nullable|in:post,reel,story,poll,carousel',
      // Poll fields
      'poll_options' => 'nullable|array|min:2|max:4',
      'poll_options.*' => 'nullable|string|max:25',
      'poll_duration_hours' => 'nullable|integer|min:1|max:168',
      // Carousel fields
      'carousel_items' => 'nullable|array',
      // Content metadata
      'content_metadata' => 'nullable|array',
      // Background upload flags
      'has_uploading_files' => 'nullable',
      'uploading_files_count' => 'nullable|integer',
    ];
  }

  /**
   * Configure the validator instance.
   */
  protected function withValidator(Validator $validator): void
  {
    $validator->after(function ($validator) {
      // Get content type (already defaulted to 'post' in prepareForValidation)
      $contentType = $this->input('content_type', 'post');
      
      // Get social account IDs
      $socialAccountIds = $this->input('social_accounts', []);
      
      // Get media files - include both UploadedFile instances and metadata arrays
      $mediaFiles = collect($this->input('media', []))
        ->filter(function ($file) {
          // Accept UploadedFile instances
          if ($file instanceof UploadedFile) {
            return true;
          }
          // Accept metadata arrays with required fields
          if (is_array($file) && (isset($file['key']) || isset($file['mime_type']) || isset($file['type']))) {
            return true;
          }
          return false;
        })
        ->values()
        ->toArray();

      // Check if there are files currently uploading
      $hasUploadingFiles = $this->input('has_uploading_files') === '1' || $this->input('has_uploading_files') === true;
      $uploadingFilesCount = (int) $this->input('uploading_files_count', 0);

      // If files are uploading, skip media validation
      if ($hasUploadingFiles) {
        \Log::info('⏭️ Skipping media validation - files are uploading in background (new publication)', [
          'uploading_files_count' => $uploadingFilesCount,
          'content_type' => $contentType
        ]);
        return; // Skip validation
      }

      // Validate content type
      $validationService = app(ContentTypeValidationService::class);
      $result = $validationService->validateContentType($contentType, $socialAccountIds, $mediaFiles);

      if (!$result->isValid) {
        foreach ($result->errors as $error) {
          $validator->errors()->add('content_type', $error);
        }
      }
    });
  }

  /**
   * Get custom error messages for validation rules.
   */
  public function messages(): array
  {
    return [
      'content_type.in' => 'The selected content type is invalid. Valid types are: post, reel, story, poll, carousel.',
      'social_accounts.*.exists' => 'One or more selected social accounts do not exist.',
      'scheduled_at.date' => __('publications.validation.scheduledInvalid'),
    ];
  }
}
