<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Publications\Publication;
use App\Models\ScheduledPost;
use Illuminate\Support\Facades\Auth;
use App\Models\SocialPostLog;
use App\Http\Requests\Publications\StorePublicationRequest;
use App\Http\Requests\Publications\UpdatePublicationRequest;
use App\Actions\Publications\CreatePublicationAction;
use App\Actions\Publications\UpdatePublicationAction;
use App\Actions\Publications\PublishPublicationAction;
use App\Actions\Publications\UnpublishPublicationAction;

class PublicationController extends Controller
{
  public function index(Request $request)
  {
    $query = Publication::where('user_id', Auth::id())
      ->with(['mediaFiles.derivatives', 'scheduled_posts.socialAccount', 'socialPostLogs.socialAccount', 'campaigns'])
      ->orderBy('created_at', 'desc');

    if ($request->has('status') && $request->status !== 'all') {
      $status = $request->status;
      if (method_exists(Publication::class, "scope" . ucfirst($status))) {
        $query->$status();
      }
    }

    if ($request->has(['date_start', 'date_end'])) {
      $query->byDateRange($request->date_start, $request->date_end);
    }

    if ($request->has('exclude_assigned') && $request->exclude_assigned === 'true') {
      $query->where(function ($q) use ($request) {
        $q->doesntHave('campaigns');
        if ($request->has('include_campaign_id')) {
          $q->orWhereHas('campaigns', fn($subQ) => $subQ->where('campaigns.id', $request->include_campaign_id));
        }
      });
    }

    $publications = ($request->query('simplified') === 'true')
      ? $query->get()
      : $query->paginate($request->query('per_page', 6));

    return response()->json([
      'success' => true,
      'publications' => $publications,
      'status' => 200
    ]);
  }

  public function store(StorePublicationRequest $request, CreatePublicationAction $action)
  {
    try {
      $publication = $action->execute($request->validated(), $request->file('media', []));

      return response()->json([
        'success' => true,
        'message' => 'Publication created successfully',
        'publication' => $publication,
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Creation failed: ' . $e->getMessage(),
        'status' => 500
      ], 500);
    }
  }

  public function show(Request $request, $id)
  {
    $publication = Publication::with(['mediaFiles.derivatives', 'scheduled_posts.socialAccount', 'socialPostLogs.socialAccount', 'campaigns'])
      ->findOrFail($id);

    return $request->wantsJson()
      ? response()->json(['success' => true, 'publication' => $publication])
      : view('publications.show');
  }

  public function update(UpdatePublicationRequest $request, $id, UpdatePublicationAction $action)
  {
    try {
      $publication = Publication::findOrFail($id);
      $publication = $action->execute($publication, $request->validated(), $request->file('media', []));

      return response()->json([
        'success' => true,
        'message' => 'Publication updated successfully',
        'publication' => $publication,
        'status' => 200
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Update failed: ' . $e->getMessage(),
        'status' => 500
      ], 500);
    }
  }

  public function publish(Request $request, $id, PublishPublicationAction $action)
  {
    try {
      $publication = Publication::findOrFail($id);

      $action->execute($publication, $request->input('platforms'), [
        'thumbnails' => $request->file('thumbnails', []),
        'platform_settings' => $request->input('platform_settings')
      ]);

      return response()->json([
        'success' => true,
        'message' => 'Publishing started in background.',
        'status' => 'publishing'
      ]);
    } catch (\Exception $e) {
      return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
    }
  }

  public function unpublish(Request $request, $id, UnpublishPublicationAction $action)
  {
    $publication = Publication::findOrFail($id);
    $result = $action->execute($publication, $request->input('platform_ids'));

    return response()->json([
      'success' => $result['success'],
      'message' => $result['success'] ? 'Unpublished successfully' : 'Failed to unpublish',
      'details' => $result
    ], $result['success'] ? 200 : 500);
  }

  public function getPublishedPlatforms($id)
  {
    $publication = Publication::findOrFail($id);

    $scheduledAccountIds = ScheduledPost::where('publication_id', $publication->id)
      ->where('status', 'pending')
      ->pluck('social_account_id')->unique()->toArray();

    $allLogs = SocialPostLog::where('publication_id', $publication->id)
      ->orderBy('id', 'desc')->get()->groupBy('social_account_id');

    $statusGroups = ['published' => [], 'failed' => [], 'publishing' => [], 'removed_platforms' => []];

    foreach ($allLogs as $accountId => $logs) {
      if (in_array($accountId, $scheduledAccountIds)) continue;

      $status = $logs->first()->status;
      if ($status === 'removed_on_platform') $status = 'removed_platforms';

      if (isset($statusGroups[$status])) {
        $statusGroups[$status][] = $accountId;
      }
    }

    return response()->json([
      'published_platforms' => array_values(array_unique($statusGroups['published'])),
      'failed_platforms' => array_values(array_unique($statusGroups['failed'])),
      'publishing_platforms' => array_values(array_unique($statusGroups['publishing'])),
      'removed_platforms' => array_values(array_unique($statusGroups['removed_platforms'])),
      'scheduled_platforms' => $scheduledAccountIds
    ]);
  }
}
