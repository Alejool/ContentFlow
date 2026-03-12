<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Publications\Publication;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use App\Services\Publications\ContentTypeValidationService;
use Illuminate\Contracts\Validation\Validator;

class UpdatePublicationRequest extends FormRequest
{
  public function authorize(): bool
  {
    $publication = $this->route('publication');

    if (!$publication instanceof Publication) {
      $publication = Publication::find($publication);
    }

    // Check if publication is locked for editing
    if ($publication && $publication->isLockedForEditing()) {
      // Return false to trigger a 403 response
      return false;
    }

    return true;
  }

  /**
   * Get the validation error messages.
   */
  public function messages(): array
  {
    return [
      'scheduled_at.date' => __('publications.validation.scheduledInvalid'),
    ];
  }

  /**
   * Handle a failed authorization attempt.
   */
  protected function failedAuthorization()
  {
    $publication = $this->route('publication');

    if (!$publication instanceof Publication) {
      $publication = Publication::find($publication);
    }

    if ($publication && $publication->isLockedForEditing()) {
      $message = 'This publication is locked for editing. ';

      if ($publication->status === 'pending_review') {
        $message .= 'It is awaiting approval and cannot be modified until it is approved or rejected.';
      } elseif ($publication->status === 'approved') {
        $message .= 'It has been approved and is ready to publish. It cannot be modified unless rejected first.';
      }

      throw new \Illuminate\Auth\Access\AuthorizationException($message);
    }

    parent::failedAuthorization();
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

    // Cast is_recurring to actual boolean so validation rules like required_if work seamlessly
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
    $publication = $this->route('publication');
    if (!$publication instanceof Publication) {
      $publication = Publication::find($publication);
    }
    return [
      'title' => 'required|string|max:255',
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

            if ($hasPublishedPosts && $value !== 'published' && !$this->boolean('is_recurring')) {
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
        function ($attribute, $value, $fail) use ($publication) {
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
    ];
  }

  /**
   * Configure the validator instance.
   */
  protected function withValidator(Validator $validator): void
  {
    $validator->after(function ($validator) {
      // Get the publication being updated
      $publication = $this->route('publication');
      
      if (!$publication instanceof Publication) {
        $publication = Publication::find($publication);
      }

      if (!$publication) {
        return;
      }

      // Check if content type validation is needed
      $contentTypeChanged = $this->has('content_type') && 
                           $this->input('content_type') !== $publication->content_type;
      
      $platformsChanged = $this->has('social_accounts');
      
      $mediaChanged = $this->hasFile('media') || 
                     !empty($this->input('removed_media_ids'));

      // Only validate if relevant fields changed
      if (!$contentTypeChanged && !$platformsChanged && !$mediaChanged) {
        return;
      }

      // Get content type (use existing if not changed)
      $contentType = $this->input('content_type', $publication->content_type) ?? 'post';
      
      // Get social account IDs (use existing if not changed)
      $socialAccountIds = $this->has('social_accounts') 
        ? $this->input('social_accounts', [])
        : $publication->socialAccounts->pluck('id')->toArray();
      
      // Get media files
      // For updates, we need to consider existing media if not removed
      $newMediaFiles = collect($this->file('media', []))
        ->filter(fn($file) => $file instanceof UploadedFile)
        ->values()
        ->toArray();

      // Calculate total media count after update
      $removedMediaIds = $this->input('removed_media_ids', []);
      $existingMediaCount = $publication->mediaFiles()
        ->whereNotIn('media_files.id', $removedMediaIds)
        ->count();
      
      $totalMediaCount = $existingMediaCount + count($newMediaFiles);

      // For validation purposes, create dummy files array representing total count
      // We only validate count and type for new files
      $mediaFilesForValidation = $newMediaFiles;

      // If we have new media files, validate them
      // If we're changing content type, validate total media count
      if ($contentTypeChanged || !empty($newMediaFiles)) {
        $validationService = app(ContentTypeValidationService::class);
        
        // Validate cross-platform compatibility
        if (!empty($socialAccountIds)) {
          $platforms = \App\Models\Social\SocialAccount::whereIn('id', $socialAccountIds)
            ->pluck('platform')
            ->unique()
            ->toArray();

          $crossPlatformResult = $validationService->validateCrossPlatform($contentType, $platforms);
          
          if (!$crossPlatformResult->isValid) {
            foreach ($crossPlatformResult->errors as $error) {
              $validator->errors()->add('content_type', $error);
            }
          }
        }

        // For media validation, we need to consider the total count after update
        // Create a representation of all media files that will exist after the update
        $allMediaFilesAfterUpdate = [];
        
        // Add existing media files that won't be removed
        $existingMediaFiles = $publication->mediaFiles()
          ->whereNotIn('media_files.id', $removedMediaIds)
          ->get();
        
        foreach ($existingMediaFiles as $mediaFile) {
          $allMediaFilesAfterUpdate[] = [
            'mime_type' => $mediaFile->mime_type,
            'type' => $mediaFile->mime_type,
          ];
        }
        
        // Add new media files
        foreach ($newMediaFiles as $file) {
          $allMediaFilesAfterUpdate[] = $file;
        }

        // Validate the complete set of media files
        $mediaResult = $validationService->validateMediaFiles($contentType, $allMediaFilesAfterUpdate);
        
        if (!$mediaResult->isValid) {
          foreach ($mediaResult->errors as $error) {
            $validator->errors()->add('media', $error);
          }
        }
      }
    });
  }
}
