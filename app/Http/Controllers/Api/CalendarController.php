<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Publications\Publication;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Models\ScheduledPost;
use App\Models\UserCalendarEvent;

class CalendarController extends Controller
{
    use ApiResponse;

    /**
     * Get publications for calendar view
     */
    public function index(Request $request)
    {
        $start = $request->input('start'); // ISO date
        $end = $request->input('end');     // ISO date

        // Interpret incoming range using client's timezone when provided
        $clientTz = $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC');
        try {
            if ($start) $start = Carbon::parse($start, $clientTz)->setTimezone('UTC');
            if ($end) $end = Carbon::parse($end, $clientTz)->setTimezone('UTC');
        } catch (\Exception $e) {
            // fallback to raw values
        }

        $workspaceId = Auth::user()->current_workspace_id;
        $query = Publication::where('workspace_id', $workspaceId)
            ->with(['mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type')]);

        if ($start && $end) {
            $query->whereBetween('scheduled_at', [$start, $end]);
        } else {
            // Default to current month
            $query->whereMonth('scheduled_at', now()->month)
                ->whereYear('scheduled_at', now()->year);
        }

        $publications = $query->get();

        // 1. Format Publications as Events
        $events = $publications->map(function ($pub) {
            return [
                'id' => "pub_{$pub->id}",
                'resourceId' => $pub->id,
                'type' => 'publication',
                'title' => "[PUB] {$pub->title}",
                // Return UTC ISO strings; frontend will convert to user's timezone
                'start' => $pub->scheduled_at ? $pub->scheduled_at->copy()->setTimezone('UTC')->toIso8601String() : null,
                'status' => $pub->status,
                'color' => $this->getStatusColor($pub->status),
                'extendedProps' => [
                    'slug' => $pub->slug,
                    'thumbnail' => $pub->mediaFiles->first()?->file_path,
                ]
            ];
        });

        // 2. Format Scheduled Posts as separate events for more granular view
        $posts = ScheduledPost::whereHas('publication', function ($q) use ($workspaceId) {
            $q->where('workspace_id', $workspaceId);
        })
            ->with(['socialAccount:id,platform,account_name'])
            ->whereBetween('scheduled_at', [$start ?? now()->startOfMonth()->setTimezone('UTC'), $end ?? now()->endOfMonth()->setTimezone('UTC')])
            ->get();

        $postEvents = $posts->map(function ($post) {
            return [
                'id' => "post_{$post->id}",
                'resourceId' => $post->id,
                'type' => 'post',
                'title' => "({$post->socialAccount->platform}) {$post->socialAccount->account_name}",
                'start' => $post->scheduled_at ? $post->scheduled_at->copy()->setTimezone('UTC')->toIso8601String() : null,
                'status' => $post->status,
                'color' => $this->getStatusColor($post->status, true),
                'extendedProps' => [
                    'publication_id' => $post->publication_id,
                    'platform' => $post->socialAccount->platform,
                ]
            ];
        });

        // 3. Format User Calendar Events
        $userEvents = UserCalendarEvent::where('workspace_id', $workspaceId)
            ->where('user_id', Auth::id())
            ->whereBetween('start_date', [$start ?? now()->startOfMonth()->setTimezone('UTC'), $end ?? now()->endOfMonth()->setTimezone('UTC')])
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
                'extendedProps' => [
                    'description' => $event->description,
                ]
            ];
        });

        return $this->successResponse($events->concat($postEvents)->concat($manualEvents));
    }

    /**
     * Update publication schedule (drag and drop)
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'scheduled_at' => 'required|date',
            'type' => 'nullable|in:publication,post'
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
        } elseif ($type === 'user_event') {
            $model = UserCalendarEvent::where('workspace_id', Auth::user()->current_workspace_id)
                ->where('user_id', Auth::id())
                ->findOrFail($id);

            $duration = $model->end_date ? $model->start_date->diffInSeconds($model->end_date) : null;

            $model->update([
                'start_date' => $newDate,
                'end_date' => $duration ? $newDate->copy()->addSeconds($duration) : null,
            ]);
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
