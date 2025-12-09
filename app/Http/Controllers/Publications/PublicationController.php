<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationMedia;
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

class PublicationController extends Controller
{
  public function index(Request $request)
  {
    $query = Publication::where('user_id', Auth::id())
      ->with(['mediaFiles', 'scheduledPosts.socialAccount']);


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

    if ($request->query('simplified') === 'true') {
      $publications = $query->orderBy('created_at', 'desc')->get();
    } else {
      $publications = $query->orderBy('created_at', 'desc')->paginate(10);
    }

    return response()->json([
      'success' => true,
      'publications' => $publications,
      'status' => 200
    ]);
  }

  public function create()
  {
    return view('campaigns.create');
  }

  public function store(Request $request)
  {
    if (Publication::where('title', $request->title)->exists()) {
      return response()->json([
        'success' => false,
        'message' => 'Campaign already exists',
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

      $firstMediaFileId = null;

      if ($request->hasFile('media')) {
        foreach ($request->file('media') as $index => $file) {
          $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
          $path = $file->storeAs('campaigns', $filename, 's3');
          $absolutePath = Storage::disk('s3')->url($path);

          $mediaFile = MediaFile::create([
            'user_id' => Auth::id(),
            'campaign_id' => $publication->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $absolutePath,
            'file_type' => str_starts_with($file->getClientMimeType(), 'video/') ? 'video' : 'image',
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
          ]);

          PublicationMedia::create([
            'campaign_id' => $publication->id,
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

            \App\Models\MediaDerivative::create([
              'media_file_id' => $mediaFile->id,
              'derivative_type' => 'thumbnail',
              'file_path' => Storage::disk('s3')->url($thumbPath),
              'platform' => 'generic', // or 'youtube', 'all'
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
            'campaign_id' => $publication->id,
            'caption' => $publication->title . "\n\n" . $publication->description . "\n\n" . $publication->hashtags,
            'scheduled_at' => $scheduledAt,
            'status' => 'pending',
          ]);
        }
      }

      DB::commit();

      return response()->json([
        'success' => true,
        'message' => 'Campaign created successfully',
        'campaign' => $publication,
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
    return view('campaigns.show');
  }

  public function edit($id)
  {
    return view('campaigns.edit');
  }

  public function destroy($id)
  {
    Publication::destroy($id);
    return response()->json([
      'message' => 'Campaign deleted successfully',
    ]);
  }

  public function update(Request $request, $id)
  {
    $validatedData = $request->validate([
      'title' => 'required|string|max:255',
      'description' => 'required|string',
      'hashtags' => 'nullable|string',
      'media.*' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,avi|max:51200',
      'goal' => 'nullable|string',
      'start_date' => 'nullable|date',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'status' => 'nullable|in:draft,published',
      'scheduled_at' => 'nullable|date|after:now',
      'social_accounts' => 'nullable|array',
      'social_accounts.*' => 'exists:social_accounts,id',
    ]);
    $publication = Publication::find($id);

    if (!$publication) {
      return response()->json([
        'success' => false,
        'message' => 'Campaign not found',
        'status' => 404
      ], 404);
    }

    DB::beginTransaction();

    try {
      $publication->title = $validatedData['title'];
      $publication->description = $validatedData['description'];
      $publication->hashtags = $validatedData['hashtags'] ?? $publication->hashtags;
      $publication->goal = $validatedData['goal'] ?? $publication->goal;
      $publication->start_date = $validatedData['start_date'] ?? $publication->start_date;
      $publication->end_date = $validatedData['end_date'] ?? $publication->end_date;
      $publication->status = $validatedData['status'] ?? $publication->status;

      if (isset($validatedData['scheduled_at'])) {
        $publication->scheduled_at = $validatedData['scheduled_at'];
      }

      if ($publication->isDirty('status') && $publication->status === 'published' && !$publication->publish_date) {
        $publication->publish_date = now();
      }
      $publication->save();

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
          $path = $file->storeAs('campaigns', $filename, 's3');
          $absolutePath = Storage::disk('s3')->url($path);

          $mediaFile = MediaFile::create([
            'user_id' => Auth::id(),
            'campaign_id' => $publication->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $absolutePath,
            'file_type' => str_starts_with($file->getClientMimeType(), 'video/') ? 'video' : 'image',
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
          ]);

          PublicationMedia::create([
            'campaign_id' => $publication->id,
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

            \App\Models\MediaDerivative::create([
              'media_file_id' => $mediaFile->id,
              'derivative_type' => 'thumbnail',
              'file_path' => Storage::disk('s3')->url($thumbPath),
              'platform' => 'generic',
              'resolution' => 'custom',
            ]);
          }
        }
      }

      // Handle Thumbnails for EXISTING media
      if ($request->has('thumbnails')) {
        foreach ($request->file('thumbnails') as $key => $file) {
          if (is_numeric($key)) {
            $mediaId = (int)$key;
            if ($publication->mediaFiles()->where('id', $mediaId)->exists()) {
              $thumbFilename = Str::uuid() . '_thumb.' . $file->getClientOriginalExtension();
              $thumbPath = $file->storeAs('derivatives/thumbnails', $thumbFilename, 's3');
              \App\Models\MediaDerivative::updateOrCreate(
                ['media_file_id' => $mediaId, 'derivative_type' => 'thumbnail'],
                [
                  'file_path' => Storage::disk('s3')->url($thumbPath),
                  'platform' => 'generic',
                  'resolution' => 'custom',
                ]
              );
            }
          }
        }
      }

      if (!empty($validatedData['scheduled_at']) && !empty($validatedData['social_accounts'])) {
        ScheduledPost::where('campaign_id', $publication->id)
          ->where('status', 'pending')
          ->delete();

        $firstMedia = $publication->media()->with('mediaFile')->first();
        $mediaFileId = $firstMedia ? $firstMedia->media_file_id : null;
        $schedules = $request->input('social_account_schedules', []);

        foreach ($validatedData['social_accounts'] as $accountId) {
          $scheduledAt = isset($schedules[$accountId]) ? $schedules[$accountId] : $validatedData['scheduled_at'];

          ScheduledPost::create([
            'user_id' => Auth::id(),
            'social_account_id' => $accountId,
            'campaign_id' => $publication->id,
            'media_file_id' => $mediaFileId,
            'caption' => $publication->title . "\n\n" . $publication->description . "\n\n" . $publication->hashtags,
            'scheduled_at' => $scheduledAt,
            'status' => 'pending',
          ]);
        }
      } elseif (!empty($validatedData['scheduled_at'])) {
        ScheduledPost::where('campaign_id', $publication->id)
          ->where('status', 'pending')
          ->update(['scheduled_at' => $validatedData['scheduled_at']]);
      }

      DB::commit();

      return response()->json([
        'success' => true,
        'message' => 'Campaign updated successfully',
        'campaign' => $publication->load('media.mediaFile'),
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

    $publication = Publication::with('mediaFiles')->findOrFail($id);
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
        'message' => "Social account for platform '{$platformIds}' not found for this campaign.",
      ], 404);
    }

    foreach ($socialAccounts as $socialAccount) {
      $platformService = self::getPlatformService($socialAccount->platform, $socialAccount->access_token);

      foreach ($publication->mediaFiles as $mediaFile) {
        // Prepare dataset for publishing
        $postData = [
          'campaign_id'   => $publication->id,
          'privacy' => 'private',
          'video_path' => $mediaFile->file_path,
          'caption'       => $publication->title . "\n\n" . $publication->description . "\n\n" . $publication->hashtags,
          'social_account_id' => $socialAccount->id,
          'content' => $publication->title . "\n\n" . $publication->description . "\n\n" . $publication->hashtags,
          'title' => $publication->title,
          'description' => $publication->description,
          'hashtags' => $publication->hashtags,
          'refresh_token' => $socialAccount->refresh_token,
        ];

        // Check for custom thumbnail in request
        // The key is expected to be 'thumbnails' array where key is media_file_id
        if ($request->hasFile("thumbnails.{$mediaFile->id}")) {
          $thumbnailFile = $request->file("thumbnails.{$mediaFile->id}");
          // Store temporarily or get path
          // For simplicity, we can pass the temporary path if the service handles it,
          // but S3 logic in Controller usually uploads first.
          // However, for thumbnails, we might just want to pass the temp file path if the service downloads it anyway.
          // Let's allow the service to handle the file path or url.
          // Since downloadVideo in service expects a URL or reachable path.

          // If it's an uploaded file, we should probably store it simply to S3 or temp to get a path
          $thumbFilename = Str::uuid() . '_thumb.' . $thumbnailFile->getClientOriginalExtension();
          $thumbPath = $thumbnailFile->storeAs('temp_thumbnails', $thumbFilename, 's3');
          $postData['thumbnail_path'] = Storage::disk('s3')->url($thumbPath);
        }

        $platformService->publishPost($postData);
      }
    }

    return response()->json([
      'success' => true,
      'message' => 'Campaign published successfully',
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
