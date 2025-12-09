<?php

namespace App\Http\Controllers\Campaigns;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CampaignController extends Controller
{
    /**
     * Display a listing of campaigns (grouping of publications)
     */
    public function index(Request $request)
    {
        $query = Campaign::where('user_id', Auth::id())
            ->with(['publications']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('date_start') && $request->has('date_end')) {
            $query->byDateRange($request->date_start, $request->date_end);
        }

        $campaigns = $query->orderBy('created_at', 'desc')->paginate(5);

        return response()->json([
            'success' => true,
            'campaigns' => $campaigns,
            'status' => 200
        ]);
    }

    /**
     * Store a new campaign
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,active,paused,completed',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'goal' => 'nullable|string',
            'budget' => 'nullable|numeric|min:0',
            'publication_ids' => 'nullable|array',
            'publication_ids.*' => 'exists:publications,id',
        ]);

        $campaign = Campaign::create([
            'user_id' => Auth::id(),
            'name' => $validatedData['name'],
            'description' => $validatedData['description'] ?? null,
            'status' => $validatedData['status'] ?? 'draft',
            'start_date' => $validatedData['start_date'] ?? null,
            'end_date' => $validatedData['end_date'] ?? null,
            'goal' => $validatedData['goal'] ?? null,
            'budget' => $validatedData['budget'] ?? null,
        ]);

        // Attach publications if provided
        if (!empty($validatedData['publication_ids'])) {
            foreach ($validatedData['publication_ids'] as $index => $publicationId) {
                $campaign->publications()->attach($publicationId, ['order' => $index + 1]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Campaign created successfully',
            'campaign' => $campaign->load('publications'),
        ]);
    }

    /**
     * Display the specified campaign
     */
    public function show($id)
    {
        $campaign = Campaign::with(['publications.mediaFiles'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'campaign' => $campaign,
        ]);
    }

    /**
     * Update the specified campaign
     */
    public function update(Request $request, $id)
    {
        $campaign = Campaign::findOrFail($id);

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,active,paused,completed',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'goal' => 'nullable|string',
            'budget' => 'nullable|numeric|min:0',
            'publication_ids' => 'nullable|array',
            'publication_ids.*' => 'exists:publications,id',
        ]);

        $campaign->update($validatedData);

        // Sync publications if provided
        if (isset($validatedData['publication_ids'])) {
            $syncData = [];
            foreach ($validatedData['publication_ids'] as $index => $publicationId) {
                $syncData[$publicationId] = ['order' => $index + 1];
            }
            $campaign->publications()->sync($syncData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Campaign updated successfully',
            'campaign' => $campaign->load('publications'),
        ]);
    }

    /**
     * Remove the specified campaign
     */
    public function destroy($id)
    {
        $campaign = Campaign::findOrFail($id);
        $campaign->delete();

        return response()->json([
            'success' => true,
            'message' => 'Campaign deleted successfully',
        ]);
    }

    /**
     * Add publications to a campaign
     */
    public function addPublications(Request $request, $id)
    {
        $campaign = Campaign::findOrFail($id);

        $validatedData = $request->validate([
            'publication_ids' => 'required|array',
            'publication_ids.*' => 'exists:publications,id',
        ]);

        $currentMax = $campaign->publications()->max('order') ?? 0;

        foreach ($validatedData['publication_ids'] as $index => $publicationId) {
            $campaign->publications()->attach($publicationId, [
                'order' => $currentMax + $index + 1
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Publications added to campaign',
            'campaign' => $campaign->load('publications'),
        ]);
    }

    /**
     * Remove publications from a campaign
     */
    public function removePublications(Request $request, $id)
    {
        $campaign = Campaign::findOrFail($id);

        $validatedData = $request->validate([
            'publication_ids' => 'required|array',
            'publication_ids.*' => 'exists:publications,id',
        ]);

        $campaign->publications()->detach($validatedData['publication_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Publications removed from campaign',
            'campaign' => $campaign->load('publications'),
        ]);
    }
}
