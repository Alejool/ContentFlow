<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationMedia;
use App\Models\MediaDerivative;
use App\Models\MediaFile;
use App\Models\ScheduledPost;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\SocialPlatforms\FacebookService;
use App\Services\SocialPlatforms\InstagramService;
use App\Services\SocialPlatforms\TwitterService;
use App\Services\SocialPlatforms\YouTubeService;
use Illuminate\Support\Facades\Log;
use App\Models\SocialAccount;
use App\Models\Campaign;
use App\Models\SocialPostLog;
use App\Services\Publish\PlatformPublishService;
use App\Jobs\PublishToSocialMedia;

class PublicationController extends Controller
{
  public function index(Request $request)
  {
    $query = Publication::where('user_id', Auth::id())
      ->with(['mediaFiles.derivatives', 'scheduledPosts.socialAccount', 'socialPostLogs.socialAccount', 'campaigns'])
      ->orderBy('created_at', 'desc');

    if ($request->has('status') && $request->status !== 'all') {
      switch ($request->status) {
        case 'draft':
          $query->draft();
          break;
        case 'published':
          $query->published();
          break;
        case 'failed':
          $query->failed();
          break;
        case 'deleted':
          $query->deleted();
          break;
        case 'pending':
          $query->pending();
          break;
      }
    }

    if ($request->has('date_start') && $request->has('date_end')) {
      $query->byDateRange($request->date_start, $request->date_end);
    }

    if ($request->has('exclude_assigned') && $request->exclude_assigned === 'true') {
      $query->where(function ($q) use ($request) {
        $q->doesntHave('campaigns');
        if ($request->has('include_campaign_id')) {
          $q->orWhereHas('campaigns', function ($subQ) use ($request) {
            $subQ->where('campaigns.id', $request->include_campaign_id);
          });
        }
      });
    }

    if ($request->query('simplified') === 'true') {
      $publications = $query->get();
    } else {
      $perPage = $request->query('per_page', 7);
      $publications = $query->paginate($perPage);
    }

    return response()->json([
      'success' => true,
      'publications' => $publications,
      'status' => 200
    ]);
  }


  public function create()
  {
    return view('publications.create');
  }

  public function store(Request $request)
  {
    if (Publication::where('title', $request->title)->exists()) {
      return response()->json([
        'success' => false,
        'message' => 'Publication already exists',
        'status' => 409
      ], 409);
    }

    $validatedData = $request->validate([
      'title' => 'required|string|max:255',
      'description' => 'required|string',
      'hashtags' => 'nullable|string',
      'goal' => 'nullable|string',
      'start_date' => 'nullable|date',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'status' => 'nullable|in:draft,published',
      'scheduled_at' => 'nullable|date|after:now',
      'social_accounts' => 'nullable|array',
      'social_accounts.*' => 'exists:social_accounts,id',
      'platform_settings' => 'nullable|string',
    ]);

    DB::beginTransaction();

    try {
      $publication = Publication::create([
        'title' => $validatedData['title'],
        'description' => $validatedData['description'],
        'hashtags' => $validatedData['hashtags'] ?? '',
        'goal' => $validatedData['goal'] ?? '',
        'slug' => Str::slug($validatedData['title']),
        'user_id' => Auth::id(),
        'start_date' => $validatedData['start_date'] ?? null,
        'end_date' => $validatedData['end_date'] ?? null,
        'status' => $validatedData['status'] ?? 'draft',
        'publish_date' => ($validatedData['status'] ?? 'draft') === 'published' ? now() : null,
        'scheduled_at' => $validatedData['scheduled_at'] ?? null,
        'platform_settings' => $request->has('platform_settings')
          ? (is_string($request->platform_settings) ? json_decode($request->platform_settings, true) : $request->platform_settings)
          : Auth::user()->global_platform_settings,
      ]);

      if ($request->has('campaign_id')) {
        $campaign = Campaign::find($request->campaign_id);
        if ($campaign) {
          $publication->campaigns()->attach($campaign->id);
        }
      }

      $firstMediaFileId = null;

      if ($request->hasFile('media')) {
        foreach ($request->file('media') as $index => $file) {
          $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
          $path = $file->storeAs('publications', $filename, 's3');

          $fileType = str_starts_with($file->getClientMimeType(), 'video/') ? 'video' : 'image';

          $youtubeTypes = $request->input('youtube_types', []);
          $durations = $request->input('durations', []);

          $youtubeType = $youtubeTypes[$index] ?? null;
          $duration = isset($durations[$index]) ? (int)$durations[$index] : null;

          if ($fileType === 'video' && $youtubeType === 'short' && $duration && $duration > 60) {
            throw new \Exception("Video '{$file->getClientOriginalName()}' is {$duration}s long and cannot be marked as a Short (max 60s)");
          }

          $mediaFile = MediaFile::create([
            'user_id' => Auth::id(),
            'publication_id' => $publication->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $fileType,
            'youtube_type' => $fileType === 'video' ? $youtubeType : null,
            'duration' => $fileType === 'video' ? $duration : null,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
          ]);

          PublicationMedia::create([
            'publication_id' => $publication->id,
            'media_file_id' => $mediaFile->id,
            'order' => $index,
          ]);

          if ($index === 0) {
            $firstMediaFileId = $mediaFile->id;
            $publication->update(['image' => asset('storage/' . $path)]);
          }


          if ($request->hasFile("thumbnails.{$index}")) {
            $thumbFile = $request->file("thumbnails.{$index}");
            $thumbFilename = Str::uuid() . '_thumb.' . $thumbFile->getClientOriginalExtension();
            $thumbPath = $thumbFile->storeAs('derivatives/thumbnails', $thumbFilename, 's3');

            $existingThumbs = $mediaFile->derivatives()
              ->where('derivative_type', 'thumbnail')
              ->get();

            foreach ($existingThumbs as $existingThumb) {
              try {
                $filePath = str_replace(Storage::disk('s3')->url(''), '', $existingThumb->file_path);
                Storage::disk('s3')->delete($filePath);
              } catch (\Exception $e) {
                Log::warning('Failed to delete old thumbnail', ['error' => $e->getMessage()]);
              }
              $existingThumb->delete();
            }

            MediaDerivative::create([
              'media_file_id' => $mediaFile->id,
              'derivative_type' => 'thumbnail',
              'file_path' => $thumbPath,
              'file_name' => $thumbFilename,
              'mime_type' => $thumbFile->getClientMimeType(),
              'size' => $thumbFile->getSize(),
              'platform' => 'all',
              'resolution' => 'custom',
            ]);
          }
        }
      }

      if (!empty($validatedData['scheduled_at']) && !empty($validatedData['social_accounts'])) {
        $schedules = $request->input('social_account_schedules', []);

        $socialAccounts = SocialAccount::whereIn('id', $validatedData['social_accounts'])->get()->keyBy('id');

        foreach ($validatedData['social_accounts'] as $accountId) {
          $scheduledAt = isset($schedules[$accountId]) ? $schedules[$accountId] : $validatedData['scheduled_at'];
          $socialAccount = $socialAccounts[$accountId] ?? null;

          ScheduledPost::create([
            'user_id' => Auth::id(),
            'social_account_id' => $accountId,
            'publication_id' => $publication->id,
            'scheduled_at' => $scheduledAt,
            'status' => 'pending',
            'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
            'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
          ]);
        }
      }

      DB::commit();

      return response()->json([
        'success' => true,
        'message' => 'Publication created successfully',
        'publication' => $publication,
      ]);
    } catch (\Exception $e) {
      DB::rollBack();
      return response()->json([
        'success' => false,
        'message' => 'Creation failed: ' . $e->getMessage(),
        'status' => 500
      ], 500);
    }
  }

  public function show(Request $request, $id)
  {
    if ($request->wantsJson()) {
      $publication = Publication::with(['mediaFiles.derivatives', 'scheduledPosts.socialAccount', 'socialPostLogs.socialAccount', 'campaigns'])
        ->findOrFail($id);

      return response()->json([
        'success' => true,
        'publication' => $publication
      ]);
    }
    return view('publications.show');
  }

  public function edit($id)
  {
    return view('publications.edit');
  }

  public function destroy($id)
  {
    // Publication::destroy($id);
    // return response()->json([
    //   'message' => 'Publication deleted successfully',
    // ]);
  }

  public function update(Request $request, $id)
  {
    $publication = Publication::find($id);

    if (!$publication) {
      return response()->json([
        'success' => false,
        'message' => 'Publication not found',
        'status' => 404
      ], 404);
    }

    $validatedData = $request->validate([
      'title' => 'required|string|max:255',
      'description' => 'required|string',
      'hashtags' => 'nullable|string',
      'media.*' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,avi|max:51200',
      'goal' => 'nullable|string',
      'start_date' => 'nullable|date',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'status' => 'nullable|in:draft,published',
      // Allow past dates if not changed, otherwise require future
      'scheduled_at' => [
        'nullable',
        'date',
        function ($attribute, $value, $fail) use ($publication) {
          $existing = $publication->scheduled_at;
          // Compare timestamps to avoid format mismatch issues.
          // If value is set, and it's in the past...
          if ($value && strtotime($value) < time()) {
            // If it's effectively the same as existing (within tight tolerance), allow it.
            // Otherwise, it's a new past date, which is invalid.
            if (!$existing || abs(strtotime($value) - strtotime($existing)) > 60) {
              $fail('The scheduled date must be in the future.');
            }
          }
        }
      ],
      'social_accounts' => 'nullable|array',
      'social_accounts.*' => 'exists:social_accounts,id',
      'platform_settings' => 'nullable|string',
    ]);

    DB::beginTransaction();

    try {
      $publication->title = $validatedData['title'];
      $publication->description = $validatedData['description'];
      $publication->hashtags = $validatedData['hashtags'] ?? $publication->hashtags;
      $publication->goal = $validatedData['goal'] ?? $publication->goal;
      $publication->start_date = $validatedData['start_date'] ?? $publication->start_date;
      $publication->end_date = $validatedData['end_date'] ?? $publication->end_date;
      $publication->status = $validatedData['status'] ?? $publication->status;

      if (array_key_exists('scheduled_at', $validatedData)) {
        $publication->scheduled_at = $validatedData['scheduled_at'];
      }

      if ($request->has('platform_settings')) {
        $publication->platform_settings = json_decode($request->platform_settings, true);
      }

      if ($publication->isDirty('status') && $publication->status === 'published' && !$publication->publish_date) {
        $publication->publish_date = now();
      }
      $publication->save();

      if ($request->has('campaign_id')) {
        $campaign = Campaign::find($request->campaign_id);
        if ($campaign) {
          $publication->campaigns()->sync([$campaign->id]);
        } else {
          // If campaign_id is provided but null or invalid, define behavior.
          // Assuming user wants to detach if they send 'null' or empty.
          if (empty($request->campaign_id)) {
            $publication->campaigns()->detach();
          }
        }
      }

      // Sync Scheduled Posts
      if ($request->has('social_accounts') || $request->has('social_accounts_sync')) {
        $currentAccountIds = $publication->scheduledPosts()->pluck('social_account_id')->toArray();
        $newAccountIds = $validatedData['social_accounts'] ?? [];
        $schedules = $request->input('social_account_schedules', []);
        $baseSchedule = $publication->scheduled_at;

        // 1. Delete removed accounts (only if pending)
        $toRemove = array_diff($currentAccountIds, $newAccountIds);
        if (!empty($toRemove)) {
          $publication->scheduledPosts()
            ->whereIn('social_account_id', $toRemove)
            ->where('status', 'pending')
            ->delete();
        }

        // 2. Update existing or Create new
        foreach ($newAccountIds as $accountId) {
          $postSchedule = (isset($schedules[$accountId]) && !empty($schedules[$accountId])) ? $schedules[$accountId] : $baseSchedule;

          $existingPost = $publication->scheduledPosts()
            ->where('social_account_id', $accountId)
            ->first();

          if (empty($postSchedule)) {
            if ($existingPost && $existingPost->status === 'pending') {
              $existingPost->delete();
            }
            continue;
          }

          if ($existingPost) {
            // Only update if pending or user explicitly wants to overwrite?
            // Assuming editing allows updating pending posts.
            if ($existingPost->status === 'pending') {
              $existingPost->update([
                'scheduled_at' => $postSchedule,
              ]);
            }
          } else {
            // Create new
            $socialAccount = SocialAccount::find($accountId);
            ScheduledPost::create([
              'user_id' => Auth::id(),
              'social_account_id' => $accountId,
              'publication_id' => $publication->id,
              'scheduled_at' => $postSchedule,
              'status' => 'pending',
              'account_name' => $socialAccount ? $socialAccount->account_name : 'Unknown',
              'platform' => $socialAccount ? $socialAccount->platform : 'unknown',
            ]);
          }
        }
      }

      $mediaFilesToDelete = $publication->mediaFiles()->get();
      $mediaFilesToKeep = $request->input('media_keep_ids', []);
      $mediaFilesToDelete = $mediaFilesToDelete->filter(function ($mediaFile) use ($mediaFilesToKeep) {
        return !in_array($mediaFile->id, $mediaFilesToKeep);
      });

      $mediaFilesToDelete->each(function ($mediaFile) {
        $relativePath = $mediaFile->file_path;
        if (Storage::disk('s3')->exists($relativePath)) {
          Storage::disk('s3')->delete($relativePath);
        }
      });

      $idsToDelete = $mediaFilesToDelete->pluck('id');
      if ($idsToDelete->isNotEmpty()) {
        $publication->mediaFiles()->detach($idsToDelete);
        PublicationMedia::whereIn('media_file_id', $idsToDelete)->delete();
      }

      if ($request->hasFile('media')) {
        $currentMaxOrder = $publication->media()->max('order') ?? -1;

        foreach ($request->file('media') as $index => $file) {
          $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
          $path = $file->storeAs('publications', $filename, 's3');
          $absolutePath = Storage::disk('s3')->url($path);

          $fileType = str_starts_with($file->getClientMimeType(), 'video/') ? 'video' : 'image';

          // Get youtube_type and duration from request for NEW files
          $youtubeTypes = $request->input('youtube_types_new', []);
          $durations = $request->input('durations_new', []);

          $youtubeType = $youtubeTypes[$index] ?? null;
          $duration = isset($durations[$index]) ? (int)$durations[$index] : null;

          // Validate: cannot mark video as 'short' if duration > 60 seconds
          if ($fileType === 'video' && $youtubeType === 'short' && $duration && $duration > 60) {
            throw new \Exception("Video '{$file->getClientOriginalName()}' is {$duration}s long and cannot be marked as a Short (max 60s)");
          }

          $mediaFile = MediaFile::create([
            'user_id' => Auth::id(),
            'publication_id' => $publication->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $absolutePath,
            'file_type' => $fileType,
            'youtube_type' => $fileType === 'video' ? $youtubeType : null,
            'duration' => $fileType === 'video' ? $duration : null,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
          ]);

          PublicationMedia::create([
            'publication_id' => $publication->id,
            'media_file_id' => $mediaFile->id,
            'order' => $currentMaxOrder + 1 + $index,
          ]);

          if (!$publication->image) {
            $publication->update(['image' => asset('storage/' . $path)]);
          }

          // Handle Thumbnail for NEW media (key: new_{index})
          if ($request->hasFile("thumbnails.new_{$index}")) {
            $thumbFile = $request->file("thumbnails.new_{$index}");
            $thumbFilename = Str::uuid() . '_thumb.' . $thumbFile->getClientOriginalExtension();
            $thumbPath = $thumbFile->storeAs('derivatives/thumbnails', $thumbFilename, 's3');

            // DELETE ALL existing thumbnails for this video first
            $existingThumbs = $mediaFile->derivatives()
              ->where('derivative_type', 'thumbnail')
              ->get();

            foreach ($existingThumbs as $existingThumb) {
              try {
                $filePath = str_replace(Storage::disk('s3')->url(''), '', $existingThumb->file_path);
                Storage::disk('s3')->delete($filePath);
              } catch (\Exception $e) {
                Log::warning('Failed to delete old thumbnail', ['error' => $e->getMessage()]);
              }
              $existingThumb->delete();
            }

            // Create new thumbnail for ALL platforms
            MediaDerivative::create([
              'media_file_id' => $mediaFile->id,
              'derivative_type' => 'thumbnail',
              'file_path' => Storage::disk('s3')->url($thumbPath),
              'file_name' => $thumbFilename,
              'mime_type' => $thumbFile->getClientMimeType(),
              'size' => $thumbFile->getSize(),
              'platform' => 'all', // Works for YouTube and all other platforms
              'resolution' => 'custom',
            ]);
          }
        }
      }

      // Handle properties updates (like thumbnails) for EXISTING media
      if ($request->hasFile('thumbnails')) {
        foreach ($request->file('thumbnails') as $key => $thumbFile) {
          // Check if key is a numeric ID (representing an existing media file)
          if (is_numeric($key)) {
            // Get media file and verify it belongs to this publication
            $mediaFile = MediaFile::find($key);

            // Check if this media file belongs to the publication through pivot table
            $belongsToPublication = \DB::table('publication_media')
              ->where('publication_id', $publication->id)
              ->where('media_file_id', $key)
              ->exists();

            if ($mediaFile && $belongsToPublication) {
              // Upload new thumbnail
              $thumbFilename = Str::uuid() . '_thumb.' . $thumbFile->getClientOriginalExtension();
              $thumbPath = $thumbFile->storeAs('derivatives/thumbnails', $thumbFilename, 's3');
              $thumbUrl = Storage::disk('s3')->url($thumbPath);

              // DELETE ALL existing thumbnails for this video first
              $existingThumbs = $mediaFile->derivatives()
                ->where('derivative_type', 'thumbnail')
                ->get();

              foreach ($existingThumbs as $existingThumb) {
                try {
                  $filePath = str_replace(Storage::disk('s3')->url(''), '', $existingThumb->file_path);
                  Storage::disk('s3')->delete($filePath);
                } catch (\Exception $e) {
                  Log::warning('Failed to delete old thumbnail', ['error' => $e->getMessage()]);
                }
                $existingThumb->delete();
              }

              // Create new thumbnail for ALL platforms
              $mediaFile->derivatives()->create([
                'derivative_type' => 'thumbnail',
                'file_path' => $thumbUrl,
                'file_name' => $thumbFilename,
                'mime_type' => $thumbFile->getClientMimeType(),
                'size' => $thumbFile->getSize(),
                'platform' => 'all', // Works for YouTube and all other platforms
                'resolution' => 'custom',
              ]);
            }
          }
        }
      }

      // Handle YouTube Thumbnail
      if ($request->hasFile('youtube_thumbnail') && $request->has('youtube_thumbnail_video_id')) {
        $videoId = $request->input('youtube_thumbnail_video_id');

        // Get media file and verify it belongs to this publication
        $mediaFile = MediaFile::find($videoId);

        // Check if this media file belongs to the publication through pivot table
        $belongsToPublication = \DB::table('publication_media')
          ->where('publication_id', $publication->id)
          ->where('media_file_id', $videoId)
          ->exists();

        if ($mediaFile && $belongsToPublication && $mediaFile->file_type === 'video') {
          $thumbFile = $request->file('youtube_thumbnail');
          $thumbFilename = Str::uuid() . '_youtube_thumb.' . $thumbFile->getClientOriginalExtension();
          $thumbPath = $thumbFile->storeAs('derivatives/youtube/thumbnails', $thumbFilename, 's3');
          $thumbUrl = Storage::disk('s3')->url($thumbPath);

          // DELETE ALL existing thumbnails for this video (YouTube and generic)
          // This ensures the new thumbnail takes priority
          $existingThumbs = $mediaFile->derivatives()
            ->where('derivative_type', 'thumbnail')
            ->get();

          foreach ($existingThumbs as $existingThumb) {
            $filePath = $existingThumb->file_path;
            if (!empty($filePath)) {
              try {
                $filePath = str_replace(Storage::disk('s3')->url(''), '', $existingThumb->file_path);
                Storage::disk('s3')->delete($filePath);
              } catch (\Exception $e) {
                Log::warning('Failed to delete old thumbnail file', ['error' => $e->getMessage()]);
              }
              $existingThumb->delete();
            }
          }

          // Create new YouTube thumbnail (replaces all previous)
          MediaDerivative::create([
            'media_file_id' => $mediaFile->id,
            'derivative_type' => 'thumbnail',
            'file_path' => $thumbUrl,
            'file_name' => $thumbFilename,
            'mime_type' => $thumbFile->getClientMimeType(),
            'size' => $thumbFile->getSize(),
            'platform' => 'all', // Works for YouTube and all other platforms (1-to-1)
          ]);
        }
      }



      // Redundant block removed as it is handled by the sync block at the beginning.

      DB::commit();

      return response()->json([
        'success' => true,
        'message' => 'Publication updated successfully',
        'publication' => $publication->load('media.mediaFile'),
        'status' => 200
      ]);
    } catch (\Exception $e) {
      DB::rollBack();
      return response()->json([
        'success' => false,
        'message' => 'Update failed: ' . $e->getMessage(),
        'status' => 500
      ], 500);
    }
  }
  public function publish(Request $request, $id)
  {

    $publication = Publication::with(['mediaFiles', 'campaigns'])->findOrFail($id);
    $platformIds = $request->input('platforms');

    Log::info('publish request:', $request->all());


    if (!$platformIds) {
      return response()->json([
        'success' => false,
        'message' => 'The "platforms" field is required in the payload.',
      ], 422);
    }

    if (is_string($platformIds)) {
      $platformIds = explode(',', $platformIds);
    }

    $platformIds = array_filter(array_values($platformIds));
    $socialAccounts = SocialAccount::where('user_id', $publication->user_id)
      ->whereIn('id', $platformIds)
      ->get();


    if ($socialAccounts->isEmpty()) {
      return response()->json([
        'success' => false,
        'message' => "Social account for platform '{$platformIds}' not found for this publication.",
      ], 404);
    }

    // Check if any of these platforms are already scheduled for the future
    $alreadyScheduled = ScheduledPost::where('publication_id', $publication->id)
      ->whereIn('social_account_id', $socialAccounts->pluck('id'))
      ->where('status', 'pending')
      ->where('scheduled_at', '>', now())
      ->exists();

    if ($alreadyScheduled) {
      return response()->json([
        'success' => false,
        'message' => "One or more selected platforms are already scheduled for a future publication. Please cancel the schedule first.",
      ], 422);
    }

    if ($request->hasFile('thumbnails')) {
      foreach ($request->file('thumbnails') as $mediaId => $thumbnailFile) {
        if ($publication->mediaFiles->contains('id', $mediaId)) {
          try {
            $thumbFilename = Str::uuid() . '_thumb.' . $thumbnailFile->getClientOriginalExtension();
            $thumbPath = $thumbnailFile->storeAs('Derivatives/Thumbnails', $thumbFilename, 's3');
            $fullThumbUrl = Storage::disk('s3')->url($thumbPath);

            MediaDerivative::updateOrCreate(
              [
                'media_file_id' => $mediaId,
                'derivative_type' => 'thumbnail',
              ],
              [
                'file_path' => $fullThumbUrl,
                'file_name' => $thumbFilename,
                'mime_type' => $thumbnailFile->getMimeType(),
                'size' => $thumbnailFile->getSize(),
              ]
            );

            Log::info('Thumbnail persisted for media', ['media_id' => $mediaId, 'path' => $fullThumbUrl]);
          } catch (\Exception $e) {
            Log::error('Failed to save thumbnail derivative', ['media_id' => $mediaId, 'error' => $e->getMessage()]);
          }
        }
      }
    }

    if ($request->hasFile('youtube_thumbnail') && $request->has('youtube_thumbnail_video_id')) {
      $videoId = $request->input('youtube_thumbnail_video_id');

      $mediaFile = MediaFile::find($videoId);

      $belongsToPublication = DB::table('publication_media')
        ->where('publication_id', $publication->id)
        ->where('media_file_id', $videoId)
        ->exists();

      if ($mediaFile && $belongsToPublication && $mediaFile->file_type === 'video') {
        try {
          $thumbFile = $request->file('youtube_thumbnail');
          $thumbFilename = Str::uuid() . '_youtube_thumb.' . $thumbFile->getClientOriginalExtension();
          $thumbPath = $thumbFile->storeAs('derivatives/youtube/thumbnails', $thumbFilename, 's3');
          $thumbUrl = Storage::disk('s3')->url($thumbPath);

          $existingThumbs = $mediaFile->derivatives()
            ->where('derivative_type', 'thumbnail')
            ->get();

          foreach ($existingThumbs as $existingThumb) {
            try {
              $filePath = str_replace(Storage::disk('s3')->url(''), '', $existingThumb->file_path);
              Storage::disk('s3')->delete($filePath);
            } catch (\Exception $e) {
              Log::warning('Failed to delete old thumbnail file', ['error' => $e->getMessage()]);
            }
            $existingThumb->delete();
          }

          MediaDerivative::create([
            'media_file_id' => $mediaFile->id,
            'derivative_type' => 'thumbnail',
            'file_path' => $thumbUrl,
            'file_name' => $thumbFilename,
            'mime_type' => $thumbFile->getClientMimeType(),
            'size' => $thumbFile->getSize(),
            'platform' => 'all',
          ]);

          Log::info('YouTube thumbnail persisted for publish', ['media_id' => $mediaFile->id, 'path' => $thumbUrl]);
        } catch (\Exception $e) {
          Log::error('Failed to save YouTube thumbnail for publish', ['media_id' => $mediaFile->id, 'error' => $e->getMessage()]);
        }
      }
    }

    // Update platform settings if provided in the request
    if ($request->has('platform_settings')) {
      $settings = $request->input('platform_settings');
      if (is_string($settings)) {
        $settings = json_decode($settings, true);
      }
      $publication->update(['platform_settings' => $settings]);
    }

    // Pre-initialize logs to Pending state for immediate UI feedback & uniqueness cleanup
    try {
      $publishService = app(PlatformPublishService::class);
      $publishService->initializeLogs($publication, $socialAccounts, 'publishing'); // This updates status to 'publishing' immediately
    } catch (\Exception $e) {
      Log::error('Failed to pre-initialize logs in Controller', ['error' => $e->getMessage()]);
      // We continue to dispatch; the Job will attempt to initialize again and handle errors if they persist.
    }

    $publication->update(['status' => 'publishing']);

    PublishToSocialMedia::dispatch($publication, $socialAccounts)->onQueue('publishing');

    return response()->json([
      'success' => true,
      'message' => 'Publishing started in background. You will be notified when it completes.',
      'status' => 'publishing'
    ]);
  }

  public function unpublish(Request $request, $id)
  {
    $publication = Publication::findOrFail($id);

    Log::info('Publication unpublishing', ['publication' => $publication, 'platform_ids' => $request->input('platform_ids')]);

    $publishService = app(PlatformPublishService::class);
    $platformIds = $request->input('platform_ids');

    if (!empty($platformIds) && is_array($platformIds)) {
      $result = $publishService->unpublishFromPlatforms($publication, $platformIds);
    } else {
      $result = $publishService->unpublishFromAllPlatforms($publication);
    }

    if ($result['success']) {
      // Solo cambiar a borrador si ya no queda ninguna plataforma publicada
      $remaining = $publication->socialPostLogs()
        ->where('status', 'published')
        ->count();

      if ($remaining === 0) {
        $publication->update(['status' => 'draft']);
      }

      return response()->json([
        'success' => true,
        'message' => 'Publication unpublished successfully',
        'details' => $result
      ]);
    } else {
      return response()->json([
        'success' => false,
        'message' => 'Failed to unpublish',
        'details' => $result
      ], 500);
    }
  }

  /**
   * Get list of social account IDs where this publication is published
   */
  public function getPublishedPlatforms($id)
  {
    $publication = Publication::find($id);

    if (!$publication) {
      return response()->json(['error' => 'Publication not found'], 404);
    }

    // 1. Get all pending future schedules
    $scheduledAccountIds = ScheduledPost::where('publication_id', $publication->id)
      ->where('status', 'pending')
      ->where('scheduled_at', '>', now())
      ->pluck('social_account_id')
      ->unique()
      ->toArray();

    // 2. Get all logs for this publication
    $allLogs = SocialPostLog::where('publication_id', $publication->id)
      ->orderBy('id', 'desc')
      ->get()
      ->groupBy('social_account_id');

    $publishedAccountIds = [];
    $failedAccountIds = [];
    $publishingAccountIds = [];
    $removedOfPlatforms = [];

    // Determine latest status for each account from logs
    foreach ($allLogs as $accountId => $logs) {
      $latestStatus = $logs->first()->status;

      // A schedule takes priority over past logs in terms of current "Pending action"
      if (in_array($accountId, $scheduledAccountIds)) {
        continue;
      }

      switch ($latestStatus) {
        case 'published':
          $publishedAccountIds[] = $accountId;
          break;
        case 'failed':
          $failedAccountIds[] = $accountId;
          break;
        case 'publishing':
          $publishingAccountIds[] = $accountId;
          break;
        case 'removed_on_platform':
          $removedOfPlatforms[] = $accountId;
          break;
      }
    }

    // Ensure mutually exclusive lists by priority: Publishing > Published > Scheduled > Failed > Removed
    $finalPublishing = array_values(array_unique($publishingAccountIds));
    $finalPublished = array_values(array_diff(array_unique($publishedAccountIds), $finalPublishing));
    $finalScheduled = array_values(array_diff($scheduledAccountIds, $finalPublishing, $finalPublished));
    $finalFailed = array_values(array_diff(array_unique($failedAccountIds), $finalPublishing, $finalPublished, $finalScheduled));
    $finalRemoved = array_values(array_diff(array_unique($removedOfPlatforms), $finalPublishing, $finalPublished, $finalScheduled, $finalFailed));

    return response()->json([
      'published_platforms' => $finalPublished,
      'failed_platforms' => $finalFailed,
      'publishing_platforms' => $finalPublishing,
      'removed_platforms' => $finalRemoved,
      'scheduled_platforms' => $finalScheduled
    ]);
  }

  private static function getPlatformService(string $platform, string $token)
  {
    return match ($platform) {
      'facebook' => new FacebookService($token),
      'instagram' => new InstagramService($token),
      'twitter' => new TwitterService($token),
      'youtube' => new YoutubeService($token),
      default => throw new \Exception('Invalid platform'),
    };
  }
}
