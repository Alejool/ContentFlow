<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkUpdateRequest;
use App\Http\Requests\Calendar\RescheduleEventRequest;
use App\Services\Calendar\CalendarViewService;
use App\Traits\System\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CalendarController extends Controller
{
    use ApiResponse;

    public function __construct(private CalendarViewService $calendar)
    {
    }

    /** GET — publications + user events for the calendar view. */
    public function index(Request $request)
    {
        $events = $this->calendar->eventsForRange(
            Auth::user()->current_workspace_id,
            Auth::id(),
            $request->only(['start', 'end', 'platforms', 'campaigns', 'statuses']),
            $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC'),
        );

        return $this->successResponse($events);
    }

    /** PATCH — reschedule a single post/user-event (drag & drop). */
    public function update(RescheduleEventRequest $request, $id)
    {
        $result = $this->calendar->reschedule(
            $request->input('type', 'post'),
            $id,
            $request->scheduled_at,
            Auth::user(),
            Auth::user()->current_workspace_id,
            $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC'),
        );

        if (!$result['ok']) {
            return $this->errorResponse($result['error'], $result['status']);
        }

        return $this->successResponse($result['model'], ucfirst($result['type']) . ' rescheduled successfully.');
    }

    /** POST — move/delete multiple events. */
    public function bulkUpdate(BulkUpdateRequest $request)
    {
        $result = $this->calendar->bulkUpdate(
            $request->input('event_ids'),
            $request->input('operation'),
            $request->input('new_date'),
            Auth::user(),
            Auth::user()->current_workspace_id,
            $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC'),
        );

        if (!$result['ok']) {
            return $this->errorResponse($result['error'], $result['status']);
        }

        return $this->successResponse($result['result'], 'Bulk operation completed.');
    }

    /** POST — undo the most recent bulk operation. */
    public function undoBulkOperation()
    {
        $result = $this->calendar->undoLastBulk(Auth::user(), Auth::user()->current_workspace_id);

        if (!$result['ok']) {
            return $this->errorResponse($result['error'], $result['status']);
        }

        return $this->successResponse($result['result'], 'Operation undone successfully.');
    }
}
