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

class CampaignController extends Controller
{

    public function index(Request $request)
    {
        $query = Campaign::where('user_id', Auth::id())
            ->with(['mediaFiles', 'scheduledPosts']);

        // Status Filter
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

        // Date Range Filter (Creation Date)
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
        // Check if the campaign already exists
        if (Campaign::where('title', $request->title)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Campaign already exists',
                'status' => 409
            ], 409);
        }

        // Validate input data
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'hashtags' => 'nullable|string',
            'media.*' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,avi|max:51200', // 50MB max
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
            // Create the campaign
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

            // Handle Media Uploads
            if ($request->hasFile('media')) {
                foreach ($request->file('media') as $index => $file) {
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('campaigns', $filename, 's3');
                    $absolutePath = Storage::disk('s3')->url($path);

                    // Create MediaFile record
                    $mediaFile = MediaFile::create([
                        'user_id' => Auth::id(),
                        'campaign_id' => $campaign->id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $absolutePath,
                        'file_type' => str_starts_with($file->getClientMimeType(), 'video/') ? 'video' : 'image',
                        'mime_type' => $file->getClientMimeType(),
                        'size' => $file->getSize(),
                    ]);

                    // Link to Campaign
                    CampaignMedia::create([
                        'campaign_id' => $campaign->id,
                        'media_file_id' => $mediaFile->id,
                        'order' => $index,
                    ]);

                    if ($index === 0) {
                        $firstMediaFileId = $mediaFile->id;
                        // For backward compatibility, update the image column if it exists and is used
                        $campaign->update(['image' => asset('storage/' . $path)]);
                    }
                }
            }

            // Handle Scheduling
            if (!empty($validatedData['scheduled_at']) && !empty($validatedData['social_accounts'])) {
                $schedules = $request->input('social_account_schedules', []);

                foreach ($validatedData['social_accounts'] as $accountId) {
                    $scheduledAt = isset($schedules[$accountId]) ? $schedules[$accountId] : $validatedData['scheduled_at'];

                    ScheduledPost::create([
                        'user_id' => Auth::id(),
                        'social_account_id' => $accountId,
                        'campaign_id' => $campaign->id,
                        'media_file_id' => $firstMediaFileId, // Attach the first media file
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
                MediaFile::whereIn('id', $idsToDelete)->delete();
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

                    // Update legacy image if it was empty
                    if (!$campaign->image) {
                        $campaign->update(['image' => asset('storage/' . $path)]);
                    }
                }
            }

            // Handle Scheduling Update
            if (!empty($validatedData['scheduled_at']) && !empty($validatedData['social_accounts'])) {
                // Remove existing scheduled posts that are still pending
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
                // Update time for existing scheduled posts
                ScheduledPost::where('campaign_id', $campaign->id)
                    ->where('status', 'pending')
                    ->update(['scheduled_at' => $validatedData['scheduled_at']]);
            }

            DB::commit();

            // Return response with the updated campaign
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
}
