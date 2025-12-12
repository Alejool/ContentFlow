<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CampaignController extends Controller
{
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

        $campaigns = $query->orderBy('created_at', 'desc')->paginate($request->query('per_page', 10));

        return response()->json([
            'success' => true,
            'campaigns' => $campaigns,
            'status' => 200
        ]);
    }

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

        return response()->json([
            'success' => true,
            'message' => 'Campaign created successfully',
            'campaign' => $campaign->load('publications'),
        ]);
    }

    public function show($id)
    {
        $campaign = Campaign::with(['publications'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'campaign' => $campaign,
        ]);
    }

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
        ]);

        $campaign->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Campaign updated successfully',
            'campaign' => $campaign->load('publications'),
        ]);
    }

    public function destroy($id)
    {
        $campaign = Campaign::findOrFail($id);
        $campaign->delete();

        return response()->json([
            'success' => true,
            'message' => 'Campaign deleted successfully',
        ]);
    }
}
