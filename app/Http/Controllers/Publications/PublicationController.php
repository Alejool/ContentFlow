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
use App\Models\Campaigns\Campaign;

class PublicationController extends Controller
{
  public function index(Request $request)
  {
    $query = Publication::where('user_id', Auth::id())
      ->with(['mediaFiles' => function ($query) {
        $query->with('derivatives')->orderBy('publication_media.order', 'asc');
      }, 'scheduledPosts.socialAccount', 'campaigns']);


    if ($request->has('status') && $request->status !== 'all') {
      switch ($request->status) {
        case 'active':
          $query->active();
          break;
        case 'upcoming':
          $query->upcoming();
          break;
        case 'completed':
          $query->completed();
          break;
        case 'draft':
          $query->where('status', 'draft');
          break;
      }
    }

    if ($request->has('date_start') && $request->has('date_end')) {
      $query->byDateRange($request->date_start, $request->date_end);
    }

    // Filter publications not associated with any campaign
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
      $publications = $query->orderBy('created_at', 'desc')->get();
    } else {
      $publications = $query->orderBy('created_at', 'desc')->paginate(5);
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
          $absolutePath = Storage::disk('s3')->url($path);

          $fileType = str_starts_with($file->getClientMimeType(), 'video/') ? 'video' : 'image';

          // Get youtube_type and duration from request
          $youtubeTypes = $request->input('youtube_types', []);
          $durations = $request->input('durations', []);

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
            'order' => $index,
          ]);

          if ($index === 0) {
            $firstMediaFileId = $mediaFile->id;
            $publication->update(['image' => asset('storage/' . $path)]);
          }


          // Handle Thumbnail Upload for this new media file
          if ($request->hasFile("thumbnails.{$index}")) {
            $thumbFile = $request->file("thumbnails.{$index}");
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

            // Create new thumbnail for ALL platforms (YouTube, etc.)
            \App\Models\MediaDerivative::create([
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

      if (!empty($validatedData['scheduled_at']) && !empty($validatedData['social_accounts'])) {
        $schedules = $request->input('social_account_schedules', []);

        foreach ($validatedData['social_accounts'] as $accountId) {
          $scheduledAt = isset($schedules[$accountId]) ? $schedules[$accountId] : $validatedData['scheduled_at'];

          ScheduledPost::create([
            'user_id' => Auth::id(),
            'social_account_id' => $accountId,
            'publication_id' => $publication->id,
            'scheduled_at' => $scheduledAt,
            'status' => 'pending',
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

  public function show($id)
  {
    return view('publications.show');
  }

  public function edit($id)
  {
    return view('publications.edit');
  }

  public function destroy($id)
  {
    Publication::destroy($id);
    return response()->json([
      'message' => 'Publication deleted successfully',
    ]);
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
      if ($request->has('social_accounts')) {
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
          $postSchedule = isset($schedules[$accountId]) ? $schedules[$accountId] : $baseSchedule;

          $existingPost = $publication->scheduledPosts()
            ->where('social_account_id', $accountId)
            ->first();

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
            ScheduledPost::create([
              'user_id' => Auth::id(),
              'social_account_id' => $accountId,
              'publication_id' => $publication->id,
              'scheduled_at' => $postSchedule,
              'status' => 'pending',
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
            \App\Models\MediaDerivative::create([
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
            // Delete file from storage
            try {
              $filePath = str_replace(Storage::disk('s3')->url(''), '', $existingThumb->file_path);
              Storage::disk('s3')->delete($filePath);
            } catch (\Exception $e) {
              Log::warning('Failed to delete old thumbnail file', ['error' => $e->getMessage()]);
            }
            // Delete database record
            $existingThumb->delete();
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



      if (!empty($validatedData['scheduled_at']) && !empty($validatedData['social_accounts'])) {
        ScheduledPost::where('publication_id', $publication->id)
          ->where('status', 'pending')
          ->delete();

        $schedules = $request->input('social_account_schedules', []);

        foreach ($validatedData['social_accounts'] as $accountId) {
          $scheduledAt = isset($schedules[$accountId]) ? $schedules[$accountId] : $validatedData['scheduled_at'];

          ScheduledPost::create([
            'user_id' => Auth::id(),
            'social_account_id' => $accountId,
            'publication_id' => $publication->id,

            'scheduled_at' => $scheduledAt,
            'status' => 'pending',
          ]);
        }
      } elseif (!empty($validatedData['scheduled_at'])) {
        ScheduledPost::where('publication_id', $publication->id)
          ->where('status', 'pending')
          ->update(['scheduled_at' => $validatedData['scheduled_at']]);
      }

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

    if ($publication->status === 'published') {
      return response()->json([
        'success' => false,
        'message' => 'This publication is already published. Unpublish it first if you want to repost.',
      ], 400);
    }

    $platformIds = $request->input('platforms');

    Log::info('publish request:', $request->all());


    if (!$platformIds) {
      return response()->json([
        'success' => false,
        'message' => 'The "platforms" field is required in the payload.',
      ], 422);
    }

    // If platforms comes as comma separated string (from FormData)
    if (is_string($platformIds)) {
      $platformIds = explode(',', $platformIds);
    }

    $platformIds = array_filter(array_values($platformIds)); // Clean up empty values
    $socialAccounts = SocialAccount::where('user_id', $publication->user_id)
      ->whereIn('id', $platformIds)
      ->get();


    if ($socialAccounts->isEmpty()) {
      return response()->json([
        'success' => false,
        'message' => "Social account for platform '{$platformIds}' not found for this publication.",
      ], 404);
    }

    // Persist Thumbnails if uploaded
    if ($request->hasFile('thumbnails')) {
      foreach ($request->file('thumbnails') as $mediaId => $thumbnailFile) {
        // Ensure mediaId corresponds to a media file in this publication to avoid orphan derivatives
        if ($publication->mediaFiles->contains('id', $mediaId)) {
          try {
            $thumbFilename = Str::uuid() . '_thumb.' . $thumbnailFile->getClientOriginalExtension();
            $thumbPath = $thumbnailFile->storeAs('Derivatives/Thumbnails', $thumbFilename, 's3');
            $fullThumbUrl = Storage::disk('s3')->url($thumbPath);

            // Create or Update Derivative
            \App\Models\MediaDerivative::updateOrCreate(
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

    // Handle YouTube Thumbnail
    if ($request->hasFile('youtube_thumbnail') && $request->has('youtube_thumbnail_video_id')) {
      $videoId = $request->input('youtube_thumbnail_video_id');

      // Get media file and verify it belongs to this publication
      $mediaFile = MediaFile::find($videoId);

      $belongsToPublication = \DB::table('publication_media')
        ->where('publication_id', $publication->id)
        ->where('media_file_id', $videoId)
        ->exists();

      if ($mediaFile && $belongsToPublication && $mediaFile->file_type === 'video') {
        try {
          $thumbFile = $request->file('youtube_thumbnail');
          $thumbFilename = Str::uuid() . '_youtube_thumb.' . $thumbFile->getClientOriginalExtension();
          $thumbPath = $thumbFile->storeAs('derivatives/youtube/thumbnails', $thumbFilename, 's3');
          $thumbUrl = Storage::disk('s3')->url($thumbPath);

          // DELETE ALL existing thumbnails for this video (YouTube and generic)
          $existingThumbs = $mediaFile->derivatives()
            ->where('derivative_type', 'thumbnail')
            ->get();

          foreach ($existingThumbs as $existingThumb) {
            // Delete file from storage
            try {
              $filePath = str_replace(Storage::disk('s3')->url(''), '', $existingThumb->file_path);
              Storage::disk('s3')->delete($filePath);
            } catch (\Exception $e) {
              Log::warning('Failed to delete old thumbnail file', ['error' => $e->getMessage()]);
            }
            // Delete database record
            $existingThumb->delete();
          }

          // Create new YouTube thumbnail (replaces all previous)
          \App\Models\MediaDerivative::create([
            'media_file_id' => $mediaFile->id,
            'derivative_type' => 'thumbnail',
            'file_path' => $thumbUrl,
            'file_name' => $thumbFilename,
            'mime_type' => $thumbFile->getClientMimeType(),
            'size' => $thumbFile->getSize(),
            'platform' => 'all', // Works for YouTube and all other platforms (1-to-1)
          ]);

          Log::info('YouTube thumbnail persisted for publish', ['media_id' => $mediaFile->id, 'path' => $thumbUrl]);
        } catch (\Exception $e) {
          Log::error('Failed to save YouTube thumbnail for publish', ['media_id' => $mediaFile->id, 'error' => $e->getMessage()]);
        }
      }
    }

    // Use PlatformPublishService to handle publishing + Playlists
    $publishService = app(\App\Services\Publish\PlatformPublishService::class);
    $result = $publishService->publishToAllPlatforms($publication, $socialAccounts);

    // Check if any platform was successful
    $anySuccess = false;
    if (isset($result['platform_results'])) {
      foreach ($result['platform_results'] as $platformResult) {
        if (!empty($platformResult['success'])) {
          $anySuccess = true;
          break;
        }
      }
    }

    // Update publication status if at least one platform succeeded
    if ($anySuccess && !$result['has_errors']) {
      // Completamente exitoso
      $publication->update([
        'status' => 'published',
        'publish_date' => now(),
      ]);
    } elseif ($anySuccess && $result['has_errors']) {
      // Parcialmente exitoso (algunos fallaron)
      // Igual marcamos como publicado porque hay contenido en vivo que requiere unpublish
      $publication->update([
        'status' => 'published',
        'publish_date' => now(),
      ]);
    }

    return response()->json([
      'success' => !$result['has_errors'],
      'message' => $result['has_errors'] ? 'Some publications failed' : 'Publication published successfully',
      'details' => $result
    ]);
  }

  public function unpublish(Request $request, $id)
  {
    $publication = Publication::findOrFail($id);

    if ($publication->status !== 'published') {
      return response()->json(['message' => 'Publication is not published'], 400);
    }

    $publishService = app(\App\Services\Publish\PlatformPublishService::class);
    $result = $publishService->unpublishFromAllPlatforms($publication);

    if ($result['success']) {
      $publication->update(['status' => 'draft']);
      return response()->json(['success' => true, 'message' => 'Publication unpublished successfully']);
    } else {
      return response()->json(['success' => false, 'message' => 'Failed to unpublish', 'details' => $result], 500);
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

    // Get social account IDs where status is 'published'
    $publishedAccountIds = \App\Models\SocialPostLog::where('publication_id', $publication->id)
      ->where('status', 'published')
      ->pluck('social_account_id')
      ->unique()
      ->values()
      ->toArray();

    return response()->json([
      'published_platforms' => $publishedAccountIds
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
