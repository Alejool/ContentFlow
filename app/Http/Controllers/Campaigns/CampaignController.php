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
        $campaigns = Campaign::orderBy('id', 'desc')->get();
        $campaigns = Campaign::orderBy('id', 'desc')->take(10)->get();
        // $campaigns = Campaign::orderBy('id', 'asc')->skip(5)->take(5)->get();
        
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
            'image' => 'nullable|string',
        ]);

        // Create the campaign
         Campaign::create([
            'title' => $validatedData['title'],
            'description' => $validatedData['description'],
            'hashtags' => $validatedData['hashtags'] ?? '',
            'image' => $validatedData['image'] ?? '',
            'objective' => $validatedData['objective'] ?? '',
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

    public function update(Request $request, $id)
    {
        // Validate input data
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'hashtags' => 'nullable|string',
            // 'image' => 'nullable|string',
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
        $campaign->image = $validatedData['image'] ?? $campaign->image;
        
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
