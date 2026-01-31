<?php

namespace App\Http\Controllers\Campaigns;

use App\Http\Controllers\Controller;
use App\Services\StatisticsService;
use App\Models\Campaigns\Campaign;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CampaignController extends Controller
{
    use ApiResponse;

    protected $statisticsService;

    public function __construct(StatisticsService $statisticsService)
    {
        $this->statisticsService = $statisticsService;
    }

    /**
     * Display a listing of campaigns (grouping of publications)
     */
    public function index(Request $request)
    {
        $workspaceId = Auth::user()->current_workspace_id;
        $performanceData = $this->statisticsService->getTopCampaigns($workspaceId, 100);
        $cacheVersion = cache()->get("campaigns:{$workspaceId}:version", 1);

        // Cache key based on workspace, version, filters, and page
        $cacheKey = sprintf(
            'campaigns:%d:v%d:%s:%d',
            $workspaceId,
            $cacheVersion,
            md5(json_encode($request->all())),
            $request->query('page', 1)
        );

        $campaigns = cache()->remember($cacheKey, 10, function () use ($request) {
            $query = Campaign::where('workspace_id', Auth::user()->current_workspace_id)
                ->with([
                    'user' => fn($q) => $q->select('id', 'name', 'email', 'photo_url'),
                    'publications' => fn($q) => $q->select('publications.id', 'publications.title', 'publications.status', 'publications.created_at'),
                    'publications.analytics', // Eager load analytics for calculation
                    'publications.socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'published_at'),
                    'publications.socialPostLogs.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
                    'publications.mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name')
                ]);

            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }
            if ($request->has('status') && $request->status !== 'all') {
                switch ($request->status) {
                    case 'active':
                        $query->active();
                        break;
                    case 'inactive':
                        $query->inactive();
                        break;
                    case 'completed':
                        $query->completed();
                        break;
                    case 'deleted':
                        $query->deleted();
                        break;
                    case 'paused':
                        $query->paused();
                        break;
                }
            }

            if ($request->has('search') && !empty($request->search)) {
                $query->where('name', 'LIKE', '%' . $request->search . '%');
            }

            if ($request->has('date_start') && $request->has('date_end')) {
                $query->byDateRange($request->date_start, $request->date_end);
            }

            // Using simplePaginate() to avoid COUNT(*) query - only loads current page data
            $perPage = $request->query('per_page', 10);
            $campaigns = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Calculate aggregate stats for each campaign
            $campaigns->getCollection()->transform(function ($campaign) {
                $campaign->stats = [
                    'views' => $campaign->publications->flatMap->analytics->sum('views'),
                    'clicks' => $campaign->publications->flatMap->analytics->sum('clicks'),
                    'engagement' => $campaign->publications->flatMap->analytics->sum('total_engagement') // Assuming logic or separate columns
                        ?? ($campaign->publications->flatMap->analytics->sum('likes') + $campaign->publications->flatMap->analytics->sum('comments'))
                ];
                return $campaign;
            });

            return $campaigns;
        });

        if ($request->wantsJson()) {
            return $this->successResponse([
                'campaigns' => $campaigns,
                'performanceData' => $performanceData
            ]);
        }

        return \Inertia\Inertia::render('Campaigns/Index', [
            'campaigns' => $campaigns,
            'performanceData' => $performanceData
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
            'workspace_id' => Auth::user()->current_workspace_id,
            'name' => $validatedData['name'],
            'description' => $validatedData['description'] ?? null,
            'status' => $validatedData['status'] ?? 'active',
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

        // Clear cache after creating campaign
        $this->clearCampaignCache(Auth::user()->current_workspace_id);

        return $this->successResponse(['campaign' => $campaign->load('publications')], 'Campaign created successfully', 201);
    }

    /**
     * Display the specified campaign
     */
    public function show($id)
    {
        $campaign = Campaign::with([
            'publications' => fn($q) => $q->select('publications.id', 'publications.title', 'publications.status', 'publications.created_at'),
            'publications.mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name'),
            'publications.socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'published_at'),
            'publications.socialPostLogs.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name')
        ])->where('workspace_id', Auth::user()->current_workspace_id)
            ->findOrFail($id);

        return $this->successResponse(['campaign' => $campaign]);
    }

    /**
     * Update the specified campaign
     */
    public function update(Request $request, $id)
    {
        $campaign = Campaign::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);

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

        // Check if campaign has published publications before allowing name change
        if ($request->has('name') && $request->name !== $campaign->name) {
            $hasPublishedPosts = $campaign->publications()
                ->where('status', 'published')
                ->exists();

            if ($hasPublishedPosts) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot change the name of a campaign that has published posts.',
                    'errors' => ['name' => ['Cannot change the name of a campaign that has published posts.']],
                ], 422);
            }
        }

        $campaign->update($validatedData);

        // Sync publications if provided
        if (isset($validatedData['publication_ids'])) {
            $syncData = [];
            foreach ($validatedData['publication_ids'] as $index => $publicationId) {
                $syncData[$publicationId] = ['order' => $index + 1];
            }
            $campaign->publications()->sync($syncData);
        }

        // Clear cache after updating campaign
        $this->clearCampaignCache(Auth::user()->current_workspace_id);

        return $this->successResponse(['campaign' => $campaign->load('publications')], 'Campaign updated successfully');
    }

    /**
     * Remove the specified campaign
     */
    public function destroy($id)
    {
        $campaign = Campaign::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);
        $campaign->delete();

        // Clear cache after deleting campaign
        $this->clearCampaignCache(Auth::user()->current_workspace_id);

        return redirect()->back()->with('success', 'Campaign deleted successfully');
    }

    /**
     * Add publications to a campaign
     */
    public function addPublications(Request $request, $id)
    {
        $campaign = Campaign::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);

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

        return $this->successResponse(['campaign' => $campaign->load('publications')], 'Publications added to campaign');
    }

    /**
     * Remove publications from a campaign
     */
    public function removePublications(Request $request, $id)
    {
        $campaign = Campaign::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);

        $validatedData = $request->validate([
            'publication_ids' => 'required|array',
            'publication_ids.*' => 'exists:publications,id',
        ]);

        $campaign->publications()->detach($validatedData['publication_ids']);

        return $this->successResponse(['campaign' => $campaign->load('publications')], 'Publications removed from campaign');
    }

    /**
     * Clear campaign caches for a workspace
     */
    private function clearCampaignCache($workspaceId)
    {
        if (!$workspaceId)
            return;

        // Increment version to effectively clear all workspace cache keys across any driver
        try {
            cache()->increment("campaigns:{$workspaceId}:version");
        } catch (\Exception $e) {
            cache()->put("campaigns:{$workspaceId}:version", time(), now()->addDays(7));
        }

        // Also invalidate publications as they are often viewed in context of campaigns
        try {
            cache()->increment("publications:{$workspaceId}:version");
        } catch (\Exception $e) {
            cache()->put("publications:{$workspaceId}:version", time(), now()->addDays(7));
        }

        // Still try Redis pattern clear if using Redis for extra cleanliness
        if (config('cache.default') === 'redis') {
            try {
                $pattern = "campaigns:{$workspaceId}:*";
                $keys = cache()->getRedis()->keys(config('cache.prefix') . $pattern);
                if (!empty($keys)) {
                    foreach ($keys as $key) {
                        $cleanKey = str_replace(config('cache.prefix'), '', $key);
                        cache()->forget($cleanKey);
                    }
                }
            } catch (\Exception $e) {
                // Silently fail
            }
        }
    }
}
