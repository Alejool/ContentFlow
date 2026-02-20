<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Publications\Publication;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Models\Social\ScheduledPost;
use App\Models\User\UserCalendarEvent;

class CalendarController extends Controller
{
  use ApiResponse;

  /**
   * Get publications for calendar view
   */
  public function index(Request $request)
  {
    $start = $request->input('start');
    $end = $request->input('end');

    // Parse filter parameters
    $platformsParam = $request->input('platforms');
    $campaignsParam = $request->input('campaigns');
    $statusesParam = $request->input('statuses');

    $platforms = $platformsParam ? explode(',', $platformsParam) : [];
    $campaigns = $campaignsParam ? array_map('intval', explode(',', $campaignsParam)) : [];
    $statuses = $statusesParam ? explode(',', $statusesParam) : [];

    $clientTz = $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC');
    try {
      if ($start) $start = Carbon::parse($start, $clientTz)->setTimezone('UTC');
      if ($end) $end = Carbon::parse($end, $clientTz)->setTimezone('UTC');
    } catch (\Exception $e) {
    }

    $workspaceId = Auth::user()->current_workspace_id;
    $query = Publication::where('workspace_id', $workspaceId)
      ->with([
        'user:id,name,photo_url',
        'mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type'),
        'campaigns:id,name',
        'socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'platform', 'social_account_id', 'status')
      ]);

    if ($start && $end) {
      $query->whereBetween('scheduled_at', [$start, $end]);
    } else {
      $query->whereMonth('scheduled_at', now()->month)
        ->whereYear('scheduled_at', now()->year);
    }

    // Apply status filter
    if (!empty($statuses)) {
      $query->whereIn('status', $statuses);
    }

    // Apply campaign filter
    if (!empty($campaigns)) {
      $query->whereHas('campaigns', function ($q) use ($campaigns) {
        $q->whereIn('campaigns.id', $campaigns);
      });
    }

    $publications = $query->get();

    // Apply platform filter in memory (since platforms are in socialPostLogs)
    if (!empty($platforms)) {
      $publications = $publications->filter(function ($pub) use ($platforms) {
        $pubPlatforms = $pub->socialPostLogs->pluck('platform')->unique()->toArray();
        return !empty(array_intersect($platforms, $pubPlatforms));
      });
    }

    $events = $publications->map(function ($pub) {
      $pubPlatforms = $pub->socialPostLogs->pluck('platform')->unique()->toArray();
      $primaryPlatform = !empty($pubPlatforms) ? $pubPlatforms[0] : null;
      $campaignNames = $pub->campaigns->pluck('name')->toArray();
      $primaryCampaign = !empty($campaignNames) ? $campaignNames[0] : null;

      return [
        'id' => "pub_{$pub->id}",
        'resourceId' => $pub->id,
        'type' => 'publication',
        'title' => $pub->title,
        'start' => $pub->scheduled_at ? $pub->scheduled_at->copy()->setTimezone('UTC')->toIso8601String() : null,
        'status' => $pub->status,
        'color' => $this->getStatusColor($pub->status),
        'platform' => $primaryPlatform,
        'campaign' => $primaryCampaign,
        'user' => $pub->user ? [
          'id' => $pub->user->id,
          'name' => $pub->user->name,
          'photo_url' => $pub->user->photo_url,
        ] : null,
        'extendedProps' => [
          'slug' => $pub->slug,
          'thumbnail' => $pub->mediaFiles->first()?->file_path,
          'platforms' => $pubPlatforms,
          'campaigns' => $campaignNames,
        ]
      ];
    });

    // 3. Format User Calendar Events
    $userEvents = UserCalendarEvent::where('workspace_id', $workspaceId)
      ->where(function ($query) {
        $query->where('is_public', true)
          ->orWhere('user_id', Auth::id());
      })
      ->whereBetween('start_date', [$start ?? now()->startOfMonth()->setTimezone('UTC'), $end ?? now()->endOfMonth()->setTimezone('UTC')])
      ->with('user:id,name,photo_url')
      ->get();

    $manualEvents = $userEvents->map(function ($event) {
      return [
        'id' => "user_event_{$event->id}",
        'resourceId' => $event->id,
        'type' => 'user_event',
        'title' => $event->title,
        'start' => $event->start_date ? $event->start_date->copy()->setTimezone('UTC')->toIso8601String() : null,
        'end' => $event->end_date ? $event->end_date->copy()->setTimezone('UTC')->toIso8601String() : null,
        'status' => 'event',
        'color' => $event->color,
        'user' => $event->user ? [
          'id' => $event->user->id,
          'name' => $event->user->name,
          'photo_url' => $event->user->photo_url,
        ] : null,
        'extendedProps' => [
          'description' => $event->description,
          'is_public' => $event->is_public,
          'remind_at' => $event->remind_at ? $event->remind_at->copy()->setTimezone('UTC')->toIso8601String() : null,
          'user_name' => $event->user ? $event->user->name : null,
          'created_at' => $event->created_at ? $event->created_at->copy()->setTimezone('UTC')->toIso8601String() : null,
        ]
      ];
    });

    return $this->successResponse($events->concat($manualEvents));
  }

  /**
   * Update publication schedule (drag and drop)
   */
  public function update(Request $request, $id)
  {
    $request->validate([
      'scheduled_at' => 'required|date',
      'type' => 'nullable|in:publication,post,user_event'
    ]);

    $type = $request->input('type', 'publication');
    // Parse incoming scheduled_at using client's timezone header and convert to UTC
    $clientTz = $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC');
    try {
      $newDate = Carbon::parse($request->scheduled_at, $clientTz)->setTimezone('UTC');
    } catch (\Exception $e) {
      $newDate = Carbon::parse($request->scheduled_at);
    }

    if ($type === 'publication') {
      $model = Publication::where('workspace_id', Auth::user()->current_workspace_id)->findOrFail($id);
      // Check if user has permission
      if (!Auth::user()->hasPermission('manage-content', Auth::user()->current_workspace_id)) {
        return $this->errorResponse('Unauthorized', 403);
      }
      $model->update([
        'scheduled_at' => $newDate,
      ]);
      $model->load('user:id,name,photo_url');
    } elseif ($type === 'post') {
      $model = ScheduledPost::whereHas('publication', function ($q) {
        $q->where('workspace_id', Auth::user()->current_workspace_id);
      })->findOrFail($id);
      // Check if user has permission
      if (!Auth::user()->hasPermission('manage-content', Auth::user()->current_workspace_id)) {
        return $this->errorResponse('Unauthorized', 403);
      }
      $model->update([
        'scheduled_at' => $newDate,
      ]);
      $model->load('user:id,name,photo_url');
    } elseif ($type === 'user_event') {
      $model = UserCalendarEvent::where('workspace_id', Auth::user()->current_workspace_id)
        ->where('user_id', Auth::id())
        ->findOrFail($id);

      $duration = $model->end_date ? $model->start_date->diffInSeconds($model->end_date) : null;

      $model->update([
        'start_date' => $newDate,
        'end_date' => $duration ? $newDate->copy()->addSeconds($duration) : null,
      ]);
      $model->load('user:id,name,photo_url');
    } else {
      return $this->errorResponse('Invalid type', 400);
    }

    // Clear publication cache to reflect the change in the list view
    $workspaceId = Auth::user()->current_workspace_id;
    try {
      cache()->increment("publications:{$workspaceId}:version");
    } catch (\Exception $e) {
      cache()->put("publications:{$workspaceId}:version", time(), now()->addDays(7));
    }

    return $this->successResponse($model, ucfirst($type) . ' rescheduled successfully.');
  }

  /**
   * Bulk update events (move multiple events to a new date)
   */
  public function bulkUpdate(\App\Http\Requests\BulkUpdateRequest $request)
  {

    $workspaceId = Auth::user()->current_workspace_id;
    
    // Check if user has permission
    if (!Auth::user()->hasPermission('manage-content', $workspaceId)) {
      return $this->errorResponse('Unauthorized', 403);
    }

    $eventIds = $request->input('event_ids');
    $operation = $request->input('operation');
    $clientTz = $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC');
    
    try {
      $newDate = Carbon::parse($request->input('new_date'), $clientTz)->setTimezone('UTC');
    } catch (\Exception $e) {
      $newDate = Carbon::parse($request->input('new_date'));
    }

    $successful = [];
    $failed = [];
    $previousState = [];

    foreach ($eventIds as $eventId) {
      try {
        // Parse event ID to get type and resource ID
        $parts = explode('_', $eventId);
        $type = $parts[0]; // 'pub', 'post', or 'user'
        $resourceId = end($parts);

        if ($type === 'pub') {
          $model = Publication::where('workspace_id', $workspaceId)->findOrFail($resourceId);
          
          // Store previous state for undo
          $previousState[] = [
            'id' => $eventId,
            'type' => 'publication',
            'resource_id' => $resourceId,
            'scheduled_at' => $model->scheduled_at->toIso8601String(),
          ];

          if ($operation === 'move') {
            $model->update(['scheduled_at' => $newDate]);
          } elseif ($operation === 'delete') {
            $model->delete();
          }
          
          $successful[] = $eventId;
        } elseif ($type === 'post') {
          $model = ScheduledPost::whereHas('publication', function ($q) use ($workspaceId) {
            $q->where('workspace_id', $workspaceId);
          })->findOrFail($resourceId);
          
          $previousState[] = [
            'id' => $eventId,
            'type' => 'post',
            'resource_id' => $resourceId,
            'scheduled_at' => $model->scheduled_at->toIso8601String(),
          ];

          if ($operation === 'move') {
            $model->update(['scheduled_at' => $newDate]);
          } elseif ($operation === 'delete') {
            $model->delete();
          }
          
          $successful[] = $eventId;
        } elseif ($type === 'user') {
          $model = UserCalendarEvent::where('workspace_id', $workspaceId)
            ->where('user_id', Auth::id())
            ->findOrFail($resourceId);
          
          $duration = $model->end_date ? $model->start_date->diffInSeconds($model->end_date) : null;
          
          $previousState[] = [
            'id' => $eventId,
            'type' => 'user_event',
            'resource_id' => $resourceId,
            'start_date' => $model->start_date->toIso8601String(),
            'end_date' => $model->end_date ? $model->end_date->toIso8601String() : null,
          ];

          if ($operation === 'move') {
            $model->update([
              'start_date' => $newDate,
              'end_date' => $duration ? $newDate->copy()->addSeconds($duration) : null,
            ]);
          } elseif ($operation === 'delete') {
            $model->delete();
          }
          
          $successful[] = $eventId;
        }
      } catch (\Exception $e) {
        $failed[] = [
          'id' => $eventId,
          'error' => $e->getMessage(),
        ];
      }
    }

    // Store operation in history for undo functionality
    if (!empty($successful)) {
      \App\Models\Calendar\BulkOperationHistory::create([
        'user_id' => Auth::id(),
        'workspace_id' => $workspaceId,
        'operation_type' => $operation,
        'event_ids' => $eventIds,
        'previous_state' => $previousState,
        'new_state' => [
          'new_date' => $newDate->toIso8601String(),
          'operation' => $operation,
        ],
        'successful_count' => count($successful),
        'failed_count' => count($failed),
        'error_details' => $failed,
      ]);
    }

    // Clear publication cache
    try {
      cache()->increment("publications:{$workspaceId}:version");
    } catch (\Exception $e) {
      cache()->put("publications:{$workspaceId}:version", time(), now()->addDays(7));
    }

    return $this->successResponse([
      'successful' => $successful,
      'failed' => $failed,
      'total' => count($eventIds),
      'successful_count' => count($successful),
      'failed_count' => count($failed),
    ], 'Bulk operation completed.');
  }

  /**
   * Undo last bulk operation
   */
  public function undoBulkOperation(Request $request)
  {
    $workspaceId = Auth::user()->current_workspace_id;
    
    // Check if user has permission
    if (!Auth::user()->hasPermission('manage-content', $workspaceId)) {
      return $this->errorResponse('Unauthorized', 403);
    }

    // Get the last bulk operation for this user and workspace
    $lastOperation = \App\Models\Calendar\BulkOperationHistory::where('user_id', Auth::id())
      ->where('workspace_id', $workspaceId)
      ->latest()
      ->first();

    if (!$lastOperation) {
      return $this->errorResponse('No operation to undo', 404);
    }

    // Check if operation is recent (within last 5 minutes)
    if ($lastOperation->created_at->diffInMinutes(now()) > 5) {
      return $this->errorResponse('Operation too old to undo', 400);
    }

    $successful = [];
    $failed = [];

    // Restore previous state
    foreach ($lastOperation->previous_state as $state) {
      try {
        if ($state['type'] === 'publication') {
          $model = Publication::where('workspace_id', $workspaceId)->findOrFail($state['resource_id']);
          $model->update(['scheduled_at' => Carbon::parse($state['scheduled_at'])]);
          $successful[] = $state['id'];
        } elseif ($state['type'] === 'post') {
          $model = ScheduledPost::whereHas('publication', function ($q) use ($workspaceId) {
            $q->where('workspace_id', $workspaceId);
          })->findOrFail($state['resource_id']);
          $model->update(['scheduled_at' => Carbon::parse($state['scheduled_at'])]);
          $successful[] = $state['id'];
        } elseif ($state['type'] === 'user_event') {
          $model = UserCalendarEvent::where('workspace_id', $workspaceId)
            ->where('user_id', Auth::id())
            ->findOrFail($state['resource_id']);
          $model->update([
            'start_date' => Carbon::parse($state['start_date']),
            'end_date' => $state['end_date'] ? Carbon::parse($state['end_date']) : null,
          ]);
          $successful[] = $state['id'];
        }
      } catch (\Exception $e) {
        $failed[] = [
          'id' => $state['id'],
          'error' => $e->getMessage(),
        ];
      }
    }

    // Delete the operation from history
    $lastOperation->delete();

    // Clear publication cache
    try {
      cache()->increment("publications:{$workspaceId}:version");
    } catch (\Exception $e) {
      cache()->put("publications:{$workspaceId}:version", time(), now()->addDays(7));
    }

    return $this->successResponse([
      'successful' => $successful,
      'failed' => $failed,
      'total' => count($lastOperation->previous_state),
      'successful_count' => count($successful),
      'failed_count' => count($failed),
    ], 'Operation undone successfully.');
  }

  private function getStatusColor($status, $isPost = false)
  {
    $colors = [
      'published' => '#10B981', // green
      'failed' => '#EF4444',    // red
      'publishing' => '#3B82F6', // blue
      'pending_review' => '#F59E0B', // amber
      'approved' => '#8B5CF6',   // violet
      'pending' => '#6366F1',    // indigo (for posts)
      'draft' => '#6B7280',     // gray
    ];

    $color = $colors[$status] ?? $colors['draft'];

    // If it's a post, maybe make it slightly different (e.g., more transparent or secondary variant)
    // For now, same color is fine as the title distinguishes them.

    return $color;
  }
}
