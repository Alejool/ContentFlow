<?php

namespace App\Http\Controllers\Campaigns;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Campaigns\Campaign;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CampaignController extends Controller
{
    
    public function index()
    {
        // $campaigns = Campaign::all();
        // limit(10);
        $campaigns = Campaign::where('user_id', Auth::id())
            ->orderBy('id', 'desc')
            ->take(10)
            ->get();
        
        // $campaigns = Campaign::paginate(10);

        return response()->json([
            'success' => true,
            // 'message' => '',
            'campaigns' => $campaigns,
            'status' => 200
        ]);


    }
    public function create()
    {
        return view('campaigns.create');
    }
    public function store(Request $request, \App\Services\FileUploadService $fileUploadService)
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
            'image' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'goal' => 'nullable|string',
        ]);

        $imageUrl = null;
        try {
            if ($request->hasFile('image')) {
                $imageUrl = $fileUploadService->uploadToS3($request->file('image'), 'campaigns');
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage(),
                'status' => 500
            ], 500);
        }

        // Create the campaign
         Campaign::create([
            'title' => $validatedData['title'],
            'description' => $validatedData['description'],
            'hashtags' => $validatedData['hashtags'] ?? '',
            'image' => $imageUrl ?? '',
            'goal' => $validatedData['goal'] ?? '',
            'slug' => Str::slug($validatedData['title']),
            'user_id' => Auth::user()->id,
        ]);

        // Return response with the created campaign
        return response()->json([
            'message' => 'Campaign created successfully',
        ]);
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

    public function update(Request $request, $id, \App\Services\FileUploadService $fileUploadService)
    {
        // Validate input data
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'hashtags' => 'nullable|string',
            'image' => 'nullable', // Can be file or string (if not changed)
            'goal' => 'nullable|string',
        ]);

        // Find the campaign
        $campaign = Campaign::find($id);
        
        // Check if the campaign exists
        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campaign not found',
                'status' => 404
            ], 404);
        }

        // Update the fields
        $campaign->title = $validatedData['title'];
        $campaign->description = $validatedData['description'];
        $campaign->hashtags = $validatedData['hashtags'] ?? $campaign->hashtags;
        $campaign->goal = $validatedData['goal'] ?? $campaign->goal;
        
        // Handle image update
        try {
            if ($request->has('image_removed') && $request->image_removed === 'true') {
                $campaign->image = null;
            } elseif ($request->hasFile('image')) {
                $imageUrl = $fileUploadService->uploadToS3($request->file('image'), 'campaigns');
                if ($imageUrl) {
                    $campaign->image = $imageUrl;
                }
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage(),
                'status' => 500
            ], 500);
        }
        // If image is not a file, we assume it's the existing URL string, so we don't change it unless it was explicitly cleared
        
        // Save the changes
        $campaign->save();
        
        // Return response with the updated campaign
        return response()->json([
            'success' => true,
            'message' => 'Campaign updated successfully',
            'campaign' => $campaign,
            'status' => 200
        ]);
    }

}
