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

    // Normalize platform names to lowercase for consistent filtering
    $platforms = array_map('strtolower', $platforms);

    $clientTz = $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC');
    try {
      if ($start) $start = Carbon::parse($start, $clientTz)->setTimezone('UTC');
      if ($end) $end = Carbon::parse($end, $clientTz)->setTimezone('UTC');
    } catch (\Exception $e) {
    }

    $workspaceId = Auth::user()->current_workspace_id;

    // Query ScheduledPosts directly by workspace_id for better performance
    // ScheduledPosts represent actual platform-specific scheduled posts
    $scheduledPostsQuery = ScheduledPost::where('workspace_id', $workspaceId)
      ->with([
        'publication' => function ($q) {
          $q->with([
            'user:id,name,photo_url',
            'mediaFiles' => fn($mq) => $mq->select('media_files.id', 'media_files.file_path', 'media_files.file_type'),
            'campaigns:id,name'
          ]);
        }
      ]);

    if ($start && $end) {
      $scheduledPostsQuery->whereBetween('scheduled_at', [$start, $end]);
    } else {
      $scheduledPostsQuery->whereMonth('scheduled_at', now()->month)
        ->whereYear('scheduled_at', now()->year);
    }

    // Apply status filter on the scheduled post status
    if (!empty($statuses)) {
      $scheduledPostsQuery->whereIn('status', $statuses);
    }

    // Apply platform filter - normalize to lowercase for comparison
    if (!empty($platforms)) {
      $scheduledPostsQuery->where(function ($q) use ($platforms) {
        foreach ($platforms as $platform) {
          $q->orWhereRaw('LOWER(platform) = ?', [strtolower($platform)]);
        }
      });
    }

    // Apply campaign filter through publication relationship
    if (!empty($campaigns)) {
      $scheduledPostsQuery->whereHas('publication.campaigns', function ($q) use ($campaigns) {
        $q->whereIn('campaigns.id', $campaigns);
      });
    }

    $scheduledPosts = $scheduledPostsQuery->get();

    // Create events - one per scheduled post (which is already per platform)
    $events = collect();

    foreach ($scheduledPosts as $post) {
      $pub = $post->publication;

      // Skip if publication doesn't exist or doesn't belong to current workspace
      if (!$pub || $pub->workspace_id !== $workspaceId) {
        continue;
      }

      // Get the latest log if it exists to show post URL or error message
      $latestLog = $post->postLogs()->latest()->first();

      $campaignNames = $pub->campaigns->pluck('name')->toArray();
      $primaryCampaign = !empty($campaignNames) ? $campaignNames[0] : null;

      // Map 'pending' status to 'scheduled' for display
      $displayStatus = $post->status === 'pending' ? 'scheduled' : $post->status;

      // Normalize platform to lowercase for consistency
      $normalizedPlatform = strtolower($post->platform);

      // Get platform color from config (matches SOCIAL_PLATFORMS in frontend)
      $platformColor = $this->getPlatformColor($normalizedPlatform);

      $events->push([
        'id' => "post_{$post->id}", // Use scheduled post ID
        'resourceId' => $post->id,
        'publicationId' => $pub->id, // Keep reference to publication
        'type' => 'post',
        'title' => $pub->title,
        'start' => $post->scheduled_at ? $post->scheduled_at->copy()->setTimezone('UTC')->toIso8601String() : null,
        'status' => $displayStatus,
        'color' => $platformColor, // Use platform color instead of status color
        'platform' => $normalizedPlatform,
        'campaign' => $primaryCampaign,
        'user' => $pub->user ? [
          'id' => $pub->user->id,
          'name' => $pub->user->name,
          'photo_url' => $pub->user->photo_url,
        ] : null,
        'extendedProps' => [
          'slug' => '/content',
          'thumbnail' => $pub->mediaFiles->first()?->file_path,
          'platform' => $normalizedPlatform, // Add platform here too for frontend access
          'platforms' => [$normalizedPlatform],
          'campaigns' => $campaignNames,
          'publication_id' => $pub->id, // Add publication_id for frontend
          'post_id' => $post->post_id, // External platform post ID if exists
          'post_url' => $latestLog?->post_url,
          'error_message' => $latestLog?->error_message,
        ]
      ]);
    }

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
      'scheduled_at' => 'required|date|after:now',
      'type' => 'nullable|in:post,user_event'
    ]);

    $type = $request->input('type', 'post');
    $workspaceId = Auth::user()->current_workspace_id;

    // Parse incoming scheduled_at using client's timezone header and convert to UTC
    $clientTz = $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC');
    try {
      $newDate = Carbon::parse($request->scheduled_at, $clientTz)->setTimezone('UTC');
    } catch (\Exception $e) {
      $newDate = Carbon::parse($request->scheduled_at);
    }

    if ($type === 'post') {
      // Find the scheduled post and verify it belongs to current workspace
      $model = ScheduledPost::where('workspace_id', $workspaceId)
        ->find($id);

      if (!$model) {
        return $this->errorResponse('Scheduled post not found or does not belong to your workspace', 404);
      }

      // Check if user has permission
      if (!Auth::user()->hasPermission('manage-content', $workspaceId)) {
        return $this->errorResponse('Unauthorized', 403);
      }

      $model->update([
        'scheduled_at' => $newDate,
      ]);

      // Load publication relationship for response
      $model->load('publication.user:id,name,photo_url');
    } elseif ($type === 'user_event') {
      $model = UserCalendarEvent::where('workspace_id', $workspaceId)
        ->where('user_id', Auth::id())
        ->find($id);

      if (!$model) {
        return $this->errorResponse('User event not found or does not belong to your workspace', 404);
      }

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
        $type = $parts[0]; // 'post' or 'user'
        $resourceId = end($parts);

        if ($type === 'post') {
          // Find the scheduled post and verify it belongs to current workspace
          $model = ScheduledPost::where('workspace_id', $workspaceId)
            ->find($resourceId);

          if (!$model) {
            throw new \Exception('Scheduled post not found or does not belong to your workspace');
          }

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
            ->find($resourceId);

          if (!$model) {
            throw new \Exception('User event not found or does not belong to your workspace');
          }

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
        if ($state['type'] === 'post') {
          // Find the scheduled post and verify it belongs to current workspace
          $model = ScheduledPost::where('workspace_id', $workspaceId)
            ->find($state['resource_id']);

          if (!$model) {
            throw new \Exception('Scheduled post not found or does not belong to your workspace');
          }

          $model->update(['scheduled_at' => Carbon::parse($state['scheduled_at'])]);
          $successful[] = $state['id'];
        } elseif ($state['type'] === 'user_event') {
          $model = UserCalendarEvent::where('workspace_id', $workspaceId)
            ->where('user_id', Auth::id())
            ->find($state['resource_id']);

          if (!$model) {
            throw new \Exception('User event not found or does not belong to your workspace');
          }
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

  /**
   * Get platform color based on SOCIAL_PLATFORMS config
   * This matches the frontend configuration in socialPlatformsConfig.tsx
   */
  private function getPlatformColor($platform)
  {
    $platformColors = [
      'facebook' => '#2563EB',  // blue-600
      'instagram' => '#DB2777', // pink-600
      'tiktok' => '#000000',    // black
      'twitter' => '#1F2937',   // gray-900
      'x' => '#1F2937',         // gray-900 (alias for twitter)
      'youtube' => '#DC2626',   // red-600
      'linkedin' => '#1D4ED8',  // blue-700
    ];

    return $platformColors[$platform] ?? '#6B7280'; // gray-500 as default
  }

  private function getStatusColor($status, $isPost = false)
  {
    $colors = [
      'published' => '#10B981', // green
      'posted' => '#10B981',    // green (same as published)
      'failed' => '#EF4444',    // red
      'publishing' => '#3B82F6', // blue
      'pending_review' => '#F59E0B', // amber
      'approved' => '#8B5CF6',   // violet
      'pending' => '#6366F1',    // indigo - scheduled/pending posts
      'scheduled' => '#6366F1',  // indigo
      'draft' => '#6B7280',     // gray
      'no_platform' => '#F97316', // orange - for publications without social networks
    ];

    $color = $colors[$status] ?? $colors['draft'];

    return $color;
  }
}
