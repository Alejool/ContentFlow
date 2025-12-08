<?php

namespace App\Http\Controllers\Campaigns;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Campaigns\Campaign;
use App\Models\Campaigns\CampaignMedia;
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

class CampaignController extends Controller
{
    public function index(Request $request)
    {
        $query = Campaign::where('user_id', Auth::id())
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

        $campaigns = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'success' => true,
            'campaigns' => $campaigns,
            'status' => 200
        ]);
    }

    public function create()
    {
        return view('campaigns.create');
    }

    public function store(Request $request)
    {
        if (Campaign::where('title', $request->title)->exists()) {
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
            $campaign = Campaign::create([
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
                        'campaign_id' => $campaign->id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $absolutePath,
                        'file_type' => str_starts_with($file->getClientMimeType(), 'video/') ? 'video' : 'image',
                        'mime_type' => $file->getClientMimeType(),
                        'size' => $file->getSize(),
                    ]);

                    CampaignMedia::create([
                        'campaign_id' => $campaign->id,
                        'media_file_id' => $mediaFile->id,
                        'order' => $index,
                    ]);

                    if ($index === 0) {
                        $firstMediaFileId = $mediaFile->id;
                        $campaign->update(['image' => asset('storage/' . $path)]);
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
                        'campaign_id' => $campaign->id,
                        'caption' => $campaign->title . "\n\n" . $campaign->description . "\n\n" . $campaign->hashtags,
                        'scheduled_at' => $scheduledAt,
                        'status' => 'pending',
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Campaign created successfully',
                'campaign' => $campaign,
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
        Campaign::destroy($id);
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
        $campaign = Campaign::find($id);

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campaign not found',
                'status' => 404
            ], 404);
        }

        DB::beginTransaction();

        try {
            $campaign->title = $validatedData['title'];
            $campaign->description = $validatedData['description'];
            $campaign->hashtags = $validatedData['hashtags'] ?? $campaign->hashtags;
            $campaign->goal = $validatedData['goal'] ?? $campaign->goal;
            $campaign->start_date = $validatedData['start_date'] ?? $campaign->start_date;
            $campaign->end_date = $validatedData['end_date'] ?? $campaign->end_date;
            $campaign->status = $validatedData['status'] ?? $campaign->status;

            if (isset($validatedData['scheduled_at'])) {
                $campaign->scheduled_at = $validatedData['scheduled_at'];
            }

            if ($campaign->isDirty('status') && $campaign->status === 'published' && !$campaign->publish_date) {
                $campaign->publish_date = now();
            }
            $campaign->save();

            $mediaFilesToDelete = $campaign->mediaFiles()->get();
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
                $campaign->mediaFiles()->detach($idsToDelete);
                CampaignMedia::whereIn('media_file_id', $idsToDelete)->delete();
            }

            if ($request->hasFile('media')) {
                $currentMaxOrder = $campaign->media()->max('order') ?? -1;

                foreach ($request->file('media') as $index => $file) {
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('campaigns', $filename, 's3');
                    $absolutePath = Storage::disk('s3')->url($path);

                    $mediaFile = MediaFile::create([
                        'user_id' => Auth::id(),
                        'campaign_id' => $campaign->id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $absolutePath,
                        'file_type' => str_starts_with($file->getClientMimeType(), 'video/') ? 'video' : 'image',
                        'mime_type' => $file->getClientMimeType(),
                        'size' => $file->getSize(),
                    ]);

                    CampaignMedia::create([
                        'campaign_id' => $campaign->id,
                        'media_file_id' => $mediaFile->id,
                        'order' => $currentMaxOrder + 1 + $index,
                    ]);

                    if (!$campaign->image) {
                        $campaign->update(['image' => asset('storage/' . $path)]);
                    }
                }
            }

            if (!empty($validatedData['scheduled_at']) && !empty($validatedData['social_accounts'])) {
                ScheduledPost::where('campaign_id', $campaign->id)
                    ->where('status', 'pending')
                    ->delete();

                $firstMedia = $campaign->media()->with('mediaFile')->first();
                $mediaFileId = $firstMedia ? $firstMedia->media_file_id : null;
                $schedules = $request->input('social_account_schedules', []);

                foreach ($validatedData['social_accounts'] as $accountId) {
                    $scheduledAt = isset($schedules[$accountId]) ? $schedules[$accountId] : $validatedData['scheduled_at'];

                    ScheduledPost::create([
                        'user_id' => Auth::id(),
                        'social_account_id' => $accountId,
                        'campaign_id' => $campaign->id,
                        'media_file_id' => $mediaFileId,
                        'caption' => $campaign->title . "\n\n" . $campaign->description . "\n\n" . $campaign->hashtags,
                        'scheduled_at' => $scheduledAt,
                        'status' => 'pending',
                    ]);
                }
            } elseif (!empty($validatedData['scheduled_at'])) {
                ScheduledPost::where('campaign_id', $campaign->id)
                    ->where('status', 'pending')
                    ->update(['scheduled_at' => $validatedData['scheduled_at']]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Campaign updated successfully',
                'campaign' => $campaign->load('media.mediaFile'),
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

        $campaign = Campaign::with('mediaFiles')->findOrFail($id);
        $platformIds = $request->input('platforms');

        Log::info('campaign: ');
        Log::info($campaign);


        if (!$platformIds) {
            return response()->json([
                'success' => false,
                'message' => 'The "platforms" field is required in the payload.',
            ], 422);
        }

        $platformIds = array_values($platformIds);
        $socialAccounts = SocialAccount::where('user_id', $campaign->user_id)
            ->whereIn('id', $platformIds)
            ->get();


        if ($socialAccounts->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => "Social account for platform '{$platformIds}' not found for this campaign.",
            ], 404);
        }

        Log::info('files: ');
        Log::info($campaign->mediaFiles);


        foreach ($socialAccounts as $socialAccount) {
            $platformService = self::getPlatformService($socialAccount->platform, $socialAccount->access_token);

            if ($socialAccount->platform == 'youtube') {
                $firstMediaFile = $campaign->mediaFiles->first();
                $platformService->publishPost([
                    'campaign_id'   => $campaign->id,
                    'privacy' => 'private',
                    'video_path' => $firstMediaFile->file_path,
                    'caption'       => $campaign->title . "\n\n" . $campaign->description . "\n\n" . $campaign->hashtags,
                    'social_account_id' => $socialAccount->id,
                    'content' => $campaign->title . "\n\n" . $campaign->description . "\n\n" . $campaign->hashtags,
                    'title' => $campaign->title,
                    'description' => $campaign->description,
                    'hashtags' => $campaign->hashtags,
                    'refresh_token' => $socialAccount->refresh_token,
                ]);




            } else {
                foreach ($campaign->mediaFiles as $mediaFile) {
                    $platformService->publishPost([
                        'campaign_id'   => $campaign->id,
                        'privacy' => 'private',
                        'video_path' => $mediaFile->file_path,
                        'caption'       => $campaign->title . "\n\n" . $campaign->description . "\n\n" . $campaign->hashtags,
                        'social_account_id' => $socialAccount->id,
                        'content' => $campaign->title . "\n\n" . $campaign->description . "\n\n" . $campaign->hashtags,
                        'title' => $campaign->title,
                        'description' => $campaign->description,
                        'hashtags' => $campaign->hashtags,
                        'refresh_token' => $socialAccount->refresh_token,
                    ]);
                }
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
